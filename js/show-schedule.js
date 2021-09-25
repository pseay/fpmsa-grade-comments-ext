function showAssignments(scheduleTable) {
    //called when there is a schedule visible and assignment-data is probably collected
    let scheduleDate = document.querySelector('#schedule-header').querySelector('h2').innerText;
    //format string from ex. 'Monday, October 5, 2020' to '10/5/2020' to match the assignment due date
    scheduleDate = formatDate(scheduleDate);
    let assignments = JSON.parse(localStorage.getItem('assignment-data'));
    let classes = scheduleTable.querySelectorAll('tr');
    for (let i = 0; i < classes.length; i++) {
        //going through each class row
        let classRow = classes[i];
        let classCells = classRow.querySelectorAll('td');
        let activityName, container;
        for (let j = 0; j < classCells.length; j++) {
            //going through each row cell
            let classCell = classCells[j];
            if (classCell.getAttribute('data-heading') === 'Activity') {
                activityName = classCell.innerText;
            } else if (classCell.getAttribute('data-heading') === 'Details') {
                container = classCell;
                classCell.innerHTML = '';
            }
        }
        //now we have the activity name (String) and the container(Element)
        //looping through assignments and adding all applicable
        assignments.forEach((assignment) => {
            //assignment props: class, details, due, status
            if (assignment.class === activityName && assignment.due === scheduleDate) {
                //add to the container
                container.style = 'display:flex;flex-direction:column;';
                let span = document.createElement('span');
                let styling = '';
                if (assignment.status) {
                    span.setAttribute('checked', 'true');
                    styling = 'background-color:#B7DA9B;';
                } else {
                    span.setAttribute('checked', 'false');
                    styling = 'background-color:#BEAEDD;';
                }
                styling += 'border-radius:6px;padding:5px;font-size:11px;margin:3px;';
                span.style = styling;
                span.classList.add('removeable-assignment');
                span.onclick = () => {
                    if (span.getAttribute('checked') === 'true') {
                        span.setAttribute('checked', 'false');
                        span.style.setProperty('background-color', '#BEAEDD');
                    } else {
                        span.setAttribute('checked', 'true');
                        span.style.setProperty('background-color', '#B7DA9B');
                    }
                };
                span.innerText = assignment.details;
                container.appendChild(span);
            }
        });
        let addClearButtonInterval = setInterval(
            () => addClearButtonLoop(addClearButtonInterval),
            1000
        );
    }
}

function formatDate(date) {
    //format string from ex. 'Monday, October 5, 2020' to '10/5/2020' to match the assignment due date
    let middle = date.split(', ')[1];
    let year = date.split(', ')[2];
    let month = middle.split(' ')[0]; // ex. October
    const months = {
        January: 1,
        February: 2,
        March: 3,
        April: 4,
        May: 5,
        June: 6,
        July: 7,
        August: 8,
        September: 9,
        October: 10,
        November: 11,
        December: 12,
    };
    month = months[month] + '';
    let day = middle.split(' ')[1];
    return month + '/' + day + '/' + year;
}

function loadSchedulePage() {
    let makeTableAdditionsInterval = setInterval(() => makeTableAdditionsLoop(makeTableAdditionsInterval), 1000);
    let addListenersInterval = setInterval(() => addArrowListenersLoop(addListenersInterval), 1000);
}

function showButtonListener() {
    let schedule = document.querySelector('#accordionSchedules');
    if (schedule) {
        showAssignments(schedule);
        addMissingAssignments(schedule);
    }
    let resetButton = document.querySelector('#assignment-clear-button');
    resetButton.innerHTML = "<i class='fa fa-times'></i> Clear";
    resetButton.onclick = clearButtonListener;
}

function clearButtonListener() {
    document.querySelectorAll('.removeable-assignment').forEach((a) => {
        a.parentElement.style = '';
        a.outerHTML = '';
    });
    let otherThing = document.querySelector('#other-assignments-container');
    if (otherThing) {
        otherThing.remove();
    }
    let clearButton = document.querySelector('#assignment-clear-button');
    clearButton.innerHTML = "<i class='fa fa-times'></i> Show";
    clearButton.onclick = showButtonListener;
}

function addClearButtonLoop(loop) {
    if (
        document.querySelector('assignment-clear-button') ||
        document.querySelectorAll('.removeable-assignment')?.length == 0
    ) {
        //stops the program if there are no assignments for the day
        //or if there is already a clear button
        return;
    }
    let table = document.querySelector('.table.table-striped.table-mobile-stacked');
    let headerBar = table ? table.children[0] : null;
    let headerRow = headerBar ? headerBar.children[0] : null;
    let header;
    for (let i = 0; headerRow && i < headerRow.children.length; i++) {
        if (headerRow.children[i].innerText.includes('Details')) {
            header = headerRow.children[i];
        }
    }
    if (header && header.children.length == 0) {
        let button = document.createElement('button');
        button.id = 'assignment-clear-button';
        button.style.marginLeft = '15px';
        button.innerHTML = "<i class='fa fa-times'></i> Clear";
        button.onclick = clearButtonListener;
        header.appendChild(button);
        clearInterval(loop);
    } else if (header) {
        clearInterval(loop);
    }
}

function addArrowListenersLoop(loop) {
    let rightArrow = document.querySelector('.chCal-button.chCal-button-next.chCal-state-default.chCal-corner-right');
    let leftArrow = document.querySelector('.chCal-button.chCal-button-prev.chCal-state-default.chCal-corner-left');
    if (leftArrow && rightArrow) {
        leftArrow.onclick = () => {
            document.querySelectorAll('.removeable-section').forEach((section) => section.remove());
            loadSchedulePage();
        };
        rightArrow.onclick = () => {
            document.querySelectorAll('.removeable-section').forEach((section) => section.remove());
            loadSchedulePage();
        };
        clearInterval(loop);
    }
}

function addMissingAssignments(schedule) {
    if (document.querySelector('#other-assignments-container')) {
        return;
    }
    let classes = [];
    let missingAssignments = JSON.parse(localStorage.getItem('assignment-data'));
    let rows = schedule.children;
    //gets classes
    for (let i = 0; i < rows?.length; classes.push(rows[i++].children[2].innerText)) {}
    //gets date
    const scheduleDate = formatDate(document.querySelector('#schedule-header').querySelector('h2').innerText);
    //sorts missing assignments
    missingAssignments = missingAssignments.filter((assignment) => {
        return !classes.includes(assignment.class) && assignment.due == scheduleDate;
    });
    if (missingAssignments?.length > 0) {
        //add new table with missing assignments
        let mainColumn = document.querySelector('#col-main');

        let div = document.createElement('div');
        div.id = 'other-assignments-container';
        div.className = 'ch removeable-section';
        div.style = 'display:flex;flex-direction:column;align-items:center;';

        let header = document.createElement('h2');
        header.innerText = 'Other Assignments Due Today:';
        div.appendChild(header);

        let div2 = document.createElement('div');
        div2.style = 'display:flex;flex-direction:row;';

        missingAssignments.forEach((assignment) => {
            //add to the container
            let span = document.createElement('span');
            let styling = '';
            if (assignment.status) {
                span.setAttribute('checked', 'true');
                styling = 'background-color:#B7DA9B;';
            } else {
                span.setAttribute('checked', 'false');
                styling = 'background-color:#BEAEDD;';
            }
            styling += 'border-radius:6px;padding:5px;font-size:11px;margin:3px;';
            span.style = styling;
            span.classList.add('removeable-assignment');
            span.onclick = () => {
                if (span.getAttribute('checked') === 'true') {
                    span.setAttribute('checked', 'false');
                    span.style.setProperty('background-color', '#BEAEDD');
                } else {
                    span.setAttribute('checked', 'true');
                    span.style.setProperty('background-color', '#B7DA9B');
                }
            };
            span.innerText = assignment.details;
            div2.appendChild(span);
        });
        div.appendChild(div2);
        mainColumn.appendChild(div);
    }
}

function makeTableAdditionsLoop(looper) {
    let schedule = document.querySelector('#accordionSchedules');
    if (schedule && schedule.getAttribute('aoch') !== 't') {
        schedule.setAttribute('aoch', 't');
        clearInterval(looper);
        showAssignments(schedule);
        addMissingAssignments(schedule);
    }
}

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if (request?.extension === 'assignment-organizer') {
        //check to see if it is this url
        if (location.href.includes('#studentmyday/schedule')) {
            //page is schedule
            loadSchedulePage();
        }
    }
});
