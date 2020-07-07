const asana = require("asana");
const bodyParser = require("body-parser");
const express = require("express");
const fs = require("fs");
const util = require("util");

const config = require("./config.json");
const data = require("./data.json");

const app = express();
const client = asana.Client.create().useAccessToken(config.token);

app.use(bodyParser.json());

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
                    .then(() => client.tasks.findById(task.resource.gid))
                    .then((r) => {
                        if (
                            r.custom_fields.some(
                                (field) => field.name === "Task ID" && !field.number_value
                            )
                        ) {
                            task.customId = data.taskNumber;
                            data.taskNumber++;

                            console.log("Update", task.resource.gid);

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

app.listen(config.port, (err) => {
    if (err) {
        console.error(e);
        process.exit(-1);
    }
});
