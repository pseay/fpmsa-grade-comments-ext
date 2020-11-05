function gatherData() {
    let table = document.querySelector("#assignment-center-assignment-items");
    let tableRows = table.querySelectorAll("tr");
    let assignments = [];
    for (let i = 0; i < tableRows.length; i++) {
        //going through each assignment row
        let row = tableRows[i];
        let assignment = {};
        let rowData = row.querySelectorAll("td");
        for (let j = 0; j < rowData.length; j++) {
            //going through each datapoint
            let dataPoint = rowData[j];
            let heading = dataPoint.getAttribute("data-heading");
            if (heading === "Class") {
                assignment["class"] = dataPoint.innerText;
            } else if (heading === "Details") {
                assignment["details"] = dataPoint.innerText;
            } else if (heading === "Due") {
                assignment["due"] = dataPoint.innerText.split("\n")[0];
            } else if (heading === "Status") {
                //label-success label-todo
                let statusBox = dataPoint.querySelector("span");
                let status = statusBox.classList.contains("label-success"); //boolean: true if completed/graded
                assignment["status"] = status;
            }
        }
        if (!JSON.stringify(assignments).includes(JSON.stringify(assignment))) {
            assignments.push(assignment);
        }
    }
    localStorage.setItem("assignment-data", JSON.stringify(assignments));
}

function viewSchedule() {
    location.href =
        "https://francisparker.myschoolapp.com/app/student#studentmyday/schedule";
}

function addRefreshAssignmentsButton() {
    let buttonHTML =
        '<button id="refresh-assignments" class="btn btn-default btn-sm" data-toggle="modal"><i class="fa fa-calendar"></i> Schedule View</button>';

    let looper = setInterval(() => {
        let buttonContainer = document.querySelector(
            ".pull-right.assignment-calendar-button-bar"
        );
        if (buttonContainer) {
            if (!buttonContainer.querySelector("#refresh-assignments")) {
                buttonContainer.innerHTML =
                    buttonHTML + buttonContainer.innerHTML;
                document
                    .querySelector("#refresh-assignments")
                    .addEventListener("click", (e) => {
                        gatherData();
                        viewSchedule();
                    });
            }
            clearInterval(looper);
        }
    }, 500);
}

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if (request.extension === "assignment-organizer") {
        //check to see if it is this url
        if (
            location.href.includes("assignment-center") &&
            !location.href.includes("#assignmentdetail")
        ) {
            //page is assignment center
            addRefreshAssignmentsButton();
        }
    }
});
