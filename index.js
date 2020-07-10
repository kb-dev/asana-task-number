const asana = require("asana");
const bodyParser = require("body-parser");
const express = require("express");
const fs = require("fs");
const util = require("util");

const config = require("./config.json");
const data = require("./data.json");

const app = express();
const client = asana.Client.create().useAccessToken(config.token);
const port = process.env.ASANA_PORT || 80;

app.use(bodyParser.json());

client.users.me().then((me) => {
    if (me && me.name) {
        console.log(`Connected to Asana as ${me.name}`);
    } else {
        console.warn('Failed to retrieve user data');
    }
});

const writeFile = util.promisify(fs.writeFile);

app.post("/newTask", (req, res) => {
    if (req.get("X-Hook-Secret")) {
        res.setHeader("X-Hook-Secret", req.get("X-Hook-Secret"));

        return res.sendStatus(200);
    }

    if (!req.body || !req.body.events || !req.body.events.length) {
        console.log(new Date().toISOString(), "No task in last call");

        return res.sendStatus(200);
    }

    const tasksToTreat = req.body.events.filter(
        (event) =>
            event.resource &&
            event.resource.resource_type === "task" &&
            event.action === "added"
    );

    if (!tasksToTreat.length) {
        console.log(new Date().toISOString(), "No task added in last call");

        return res.sendStatus(200);
    }

    tasksToTreat
        .reduce(
            (promise, task) =>
                promise
                    .then(() => {
                        console.log('Task received: ', task.resource.gid);
                        return client.tasks.getTask(task.resource.gid);
                    })
                    .catch((err) => { // Task does not exist anymore
                        console.error(err);
                    })
                    .then((r) => {
                        if (r &&
                            r.custom_fields.some(
                                (field) => field.name === "Task ID" && !field.number_value
                            )
                        ) {
                            task.customId = data.taskNumber;
                            data.taskNumber++;

                            console.log('Update task: ', task.resource.gid);

                            return client.tasks.update(task.resource.gid, {
                                custom_fields: {
                                    [config.fieldId]: task.customId,
                                },
                            });
                        }

                        return Promise.resolve();
                    }),
            Promise.resolve()
        )
        .then(() => writeFile("./data.json", JSON.stringify(data)))
        .then(() => {
            res.sendStatus(200);
        })
        .catch((e) => {
            console.error(new Date().toISOString(), e);
            res.sendStatus(500);
        });
});

app.get('*', (req, res) => {
    res.sendStatus(404);
});
app.post('*', (req, res) => {
    res.sendStatus(404);
});

app.listen(port, (err) => {
    console.log('Server started on port ' + port);

    if (err) {
        console.error(err);
        process.exit(-1);
    }
});
