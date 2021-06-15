const LOCAL_STORAGE_KEY = 'grade-comment-storage';
const INTERVAL_LOAD_TIME = 100;//ms : decisecond
const TIME_BETWEEN_REQUESTS = 300000;//ms : five minutes

function getCurrentMillis() {
    return Date.parse(new Date());
}

function removeTags(taggedText) {
    let span = document.createElement('span');
    span.innerHTML = taggedText;
    let text = span.textContent;
    return text;
}

function hashCode(text) {
    return s.split('').reduce(function (a, b) {
        a = (a << 5) - a + b.charCodeAt(0);
        return a & a;
    }, 0);
}

async function infoPageMain() {
    addNavButton();

    //cleaning up after gc/info page
    if (!location.href.includes('#gc/info')) {
        let panel = document.querySelector('#gc-info-panel');
        if (panel) {
            panel.outerHTML = '';
        }
        let badHeader = document.querySelector('#skyui-header');
        let badSpacer = document.querySelector('#site-top-spacer');
        if (badHeader) badHeader.removeAttribute('style');
        if (badSpacer) badSpacer.removeAttribute('style');
    }
}

async function addNavButton() {
    //adding thing to top bar if it does not exist
    function getClassName() {
        let open = (getFromStorage('notifications') || []).length > 0;
        return 'fa fa-envelope' + (open ? '-open' : '');
    }
    if (!document.querySelector('#gc-info-nav-button')) {
        //adding a whole new nav button
        let nav = document.querySelector('#topnav-containter')?.children[0];
        if (!nav) {
            //waiting for nav bar to load
            setTimeout(addNavButton, INTERVAL_LOAD_TIME);
            return;
        }

        let infoNavButton = document.createElement('li');
        infoNavButton.className = 'oneline';
        infoNavButton.id = 'gc-info-nav-button';

        let infoAnchor = document.createElement('a');
        infoAnchor.href = '#gc/info';
        infoAnchor.innerHTML = '<i class="' + getClassName() + '"></i>';
        infoAnchor.setAttribute(
            'style',
            'font-size: 20px; display: flex; justify-content: center; align-items: center;'
        );

        infoNavButton.appendChild(infoAnchor);
        nav.appendChild(infoNavButton);
    } else {
        //making sure envelope is right
        let className = getClassName();
        let i = document.querySelector('#gc-info-nav-button').querySelector('i');
        i.className = className;
    }
}

function loadInfoPage() {
    let iId = setInterval(function () {
        if (location.href.includes('#gc/info') == false) {
            clearInterval(iId);
            return;
        }
        let loaded = document.querySelector('#site-header-container') != null;
        if (loaded) {
            let badHeader = document.querySelector('#skyui-header');
            let badSpacer = document.querySelector('#site-top-spacer');
            if (badHeader) badHeader.setAttribute('style', 'display: none;');
            if (badSpacer) badSpacer.setAttribute('style', 'display: none;');

            let infoPanel = document.createElement('div');
            infoPanel.setAttribute('id', 'gc-info-panel');
            infoPanel.setAttribute('class', 'gc-info-panel');
            document.querySelector('#app').children[0].appendChild(infoPanel);

            showInfoPage(infoPanel);
            clearInterval(iId);
        }
    }, INTERVAL_LOAD_TIME);
}

async function showInfoPage(infoPanel) {
    /*
        div -flex
            div -notifications
                header
                ul
                    li -notification
            div -graphs
    */
    //* Notification Panel Initialization
    generateNotificationPanel(infoPanel);
    //* Graph Panel Initialization
    generateGraphPanel(infoPanel);
}

function generateNotificationPanel(infoPanel) {
    let notificationPanel = document.createElement('div');
    notificationPanel.setAttribute('class', 'gc-panel notification');
    infoPanel.appendChild(notificationPanel);

    let notificationTitle = document.createElement('h2');
    notificationTitle.setAttribute('class', 'bb2-tile-header gc-header notification');
    notificationTitle.innerText = 'Notifications';
    notificationPanel.appendChild(notificationTitle);

    let hr = document.createElement('div');
    hr.setAttribute('class', 'gc-header-hr notification');
    notificationPanel.appendChild(hr);

    let notificationList = document.createElement('div');
    notificationList.setAttribute('class', 'gc-notification-list');
    notificationPanel.appendChild(notificationList);

    //* Adding Notifications
    const notifications = getFromStorage('notifications') || [];
    const idLookup = getFromStorage('id-lookup') || {};
    const commentHistory = getFromStorage('comment-history');
    let info = {};

    let grades = {};// {sectionId: {points, total}}
    let seen = {};
    for (let i = commentHistory.length - 1; i >= 0; i--) {
        const cur = commentHistory[i];
        if (!seen[cur.id]) {
            seen[cur.id] = true;
            
            const info = idLookup[cur.id];
            if (info.total == 0 || cur.points == null) continue;
            let section = grades[info.sectionId] || {};

            let p = section.points || 0;
            let t = section.total || 0;
            p += 1*cur.points;
            t += 1*info.total;

            section.points = p;
            section.total = t;
            grades[info.sectionId] = section;
        }
    }

    notifications.forEach((notification) => {
        if (info[notification]) return;
        let obj = {};
        obj = { ...idLookup[notification] };
        const specificHistory = commentHistory.filter((val) => val.id === notification);
        const shLen = specificHistory.length;
        if (shLen >= 2) {
            obj.hist = [specificHistory[shLen - 2], specificHistory[shLen - 1]];
        } else if (shLen == 1) {
            obj.hist = [specificHistory[0]];
        } else {
            //problem
            console.error('no history for notification');
            return;
        }
        info[notification] = obj;
    });
    info = Object.keys(info).map(key => {
        return {id: key, ...info[key]};
    });
    info.forEach((notification) => {
        let item = document.createElement('div');
        item.setAttribute('class', 'gc-notification-item');
        item.id = notification.id;

        let topBox = document.createElement('div');
        topBox.setAttribute('class', 'gc-h-box');

        let xButton = document.createElement('i');
        xButton.setAttribute('class', 'fa fa-times gc-x');
        xButton.onclick = (e) => {
            let notificationsInStorage = getFromStorage('notifications') || [];
            notificationsInStorage = notificationsInStorage.filter(n => n != notification.id);
            setToStorage('notifications', notificationsInStorage);
            document.getElementById(notification.id).outerHTML = '';
        };
        topBox.appendChild(xButton);

        let notificationTitle = document.createElement('h5');
        notificationTitle.innerText = notification.title;
        notificationTitle.setAttribute('class', 'gc-notification-title');
        topBox.appendChild(notificationTitle);

        let bottomBox = document.createElement('div');
        bottomBox.setAttribute('class', 'gc-h-box');
        
        function createNotificationInfoBox(data, max, singleClass, colorClass, tfs = 15) {
            let ib = document.createElement('div');
            ib.setAttribute('class', 'gc-notification-box ' + singleClass + ' ' + colorClass);
            //* grade
            let gradeText = '';
            if (max == 0) {
                //formative
                gradeText = 'Formative: ' + data.points;
            } else {
                let percent = (data.points * 1000) / max;
                percent = Math.round(percent) / 10;
                gradeText = data.points + '/' + max + ' = ' + percent + '%';
            }
            let gradeSpan = document.createElement('span');
            gradeSpan.innerText = gradeText;
            //* comment
            let commentSpan = document.createElement('span');
            if (data.comment) {
                commentSpan.innerText = '"' + data.comment + '"';
                commentSpan.setAttribute('class', 'gc-comment-span');
            } else {
                commentSpan.innerText = '" "';
            }
            //* time
            let timeBox = document.createElement('div');
            timeBox.setAttribute('class', 'gc-time-range-h-box');
            function formatTime(milliseconds) {
                let str = new Date(milliseconds).toLocaleString();
                let start = str.substring(0, str.lastIndexOf(':'));
                let end = str.substring(str.lastIndexOf(':') + 3);
                str = start + end;
                start = str.substring(0, str.lastIndexOf('/'));
                end = str.substring(str.lastIndexOf('/') + 6);
                str = start + end;
                return str;
            }
            let start = formatTime(data['change-period-start']);
            let end = formatTime(data['change-period-end']);

            let startSpan = document.createElement('span');
            startSpan.innerText = start;
            startSpan.setAttribute('style', 'font-size: ' + tfs + 'px');
            let dashSpan = document.createElement('span');
            dashSpan.innerText = '-';
            dashSpan.setAttribute('style', 'margin: 0 5px');
            let endSpan = document.createElement('span');
            endSpan.setAttribute('style', 'font-size: ' + tfs + 'px');
            endSpan.innerText = end;

            timeBox.appendChild(startSpan);
            timeBox.appendChild(dashSpan);
            timeBox.appendChild(endSpan);

            //* putting together
            ib.appendChild(gradeSpan);
            ib.appendChild(commentSpan);
            ib.appendChild(timeBox);
            return ib;
        }
        function getColorClass(info, points) {
            console.log({ grades, info });
            const oaG = grades[info.sectionId];
            if (oaG == undefined) {
                return 'gc-neutral';
            }
            const oaP = oaG.points;
            const oaT = oaG.total || 0;
            const aP = points;
            const aT = info.total;
            if (aT == 0 || oaT == 0 || aP == null) {
                return 'gc-neutral';
            }
            const oaGrade = oaP / oaT;
            const aGrade = aP / aT;
            return oaGrade > aGrade ? 'gc-red' : 'gc-green';
        }
        if (notification.hist.length == 1) {
            let data = notification.hist[0];
            const info = idLookup[data.id]
            let colorClass = getColorClass(info, data.points);

            infoBox = createNotificationInfoBox(data, notification.total, 'gc-single', colorClass);
            bottomBox.appendChild(infoBox);
        } else {
            let [previous, current] = notification.hist;
            const info = idLookup[current.id];
            let [oldColorClass, currentColorClass] = [getColorClass(info, previous.points), getColorClass(info, current.points)];
            let oldInfoBox = createNotificationInfoBox(previous, notification.total, 'gc-double', oldColorClass, 10);
            let newInfoBox = createNotificationInfoBox(current, notification.total, 'gc-double', currentColorClass, 10);

            let changeColorClass = previous.points > current.points ? 'gc-red' :
                        current.points > previous.points ? 'gc-green' :
                        'gc-neutral';
            let arrow = document.createElement('i');
            arrow.setAttribute('class', 'fa fa-arrow-right gc-arrow ' + changeColorClass);

            bottomBox.appendChild(oldInfoBox);
            bottomBox.appendChild(arrow);
            bottomBox.appendChild(newInfoBox);
        }

        item.appendChild(topBox);
        item.appendChild(bottomBox);
        notificationList.appendChild(item);
    });
}

async function generateGraphPanel(infoPanel) {
    let graphPanel = document.createElement('div');
    graphPanel.setAttribute('class', 'gc-panel graph');
    infoPanel.appendChild(graphPanel);

    let headerBox = document.createElement('div');
    headerBox.setAttribute('class', 'gc-h-box between');

    let graphTitle = document.createElement('h2');
    graphTitle.setAttribute('class', 'bb2-tile-header gc-header');
    graphTitle.innerText = 'Graphs';
    headerBox.appendChild(graphTitle);

    let classDropdown = document.createElement('select');
    classDropdown.id = 'class-dropdown';
    classDropdown.setAttribute('class', 'input-sm gc-class-dropdown');

    getFromStorage('current-sections').map((section) => {
        //section = {name, sectionId}
        let option = document.createElement('option');
        option.setAttribute('value', section.sectionId);
        option.innerText = section.name;
        classDropdown.appendChild(option);
    });
    classDropdown.onchange = updateGraph;
    headerBox.appendChild(classDropdown);

    let axesDropdown = document.createElement('select');
    axesDropdown.id = 'axes-dropdown';
    axesDropdown.setAttribute('class', 'input-sm');
    axesDropdown.setAttribute('style', 'margin-right: 15px;');
    ['Grade/Time', 'Grade/Assignments'].forEach((text) => {
        let option = document.createElement('option');
        option.setAttribute('value', text);
        option.innerText = text;
        axesDropdown.appendChild(option);
    });
    axesDropdown.onchange = updateGraph;
    headerBox.appendChild(axesDropdown);

    graphPanel.appendChild(headerBox);

    let hr = document.createElement('div');
    hr.setAttribute('class', 'gc-header-hr');
    graphPanel.appendChild(hr);

    let svg = document.createElement('svg');
    svg.id = 'graph-svg';
    // svg.setAttribute('style', 'height: calc(100% - 50px);');
    svg.setAttribute('width', '100%');
    svg.setAttribute('height', '380');
    graphPanel.appendChild(svg);

    updateGraph();
    function updateGraph() {
        //svg reset
        document.getElementById('graph-svg').innerHTML = '';
        //TODO: read values, get data, & add DI
        let sectionId = document.getElementById('class-dropdown').value;
        let axes = document.getElementById('axes-dropdown').value;
        console.log({ sectionId, axes });
        loadGraph();
    }
}

function useData(data, sectionId) {
    if (!data || !data?.map) return;
    data = data.map((dp) => {
        let idVal = {
            title: removeTags(dp.AssignmentShortDescription),
            total: dp.MaxPoints,
            sectionId: sectionId,
        };
        addToStorageCache('id-lookup', dp.AssignmentId, idVal);
        return { id: dp.AssignmentId, comment: removeTags(dp.AdditionalInfo), points: dp.Points };
    });
    //adding the change period start millis - end millis
    let changePeriodEnd = getCurrentMillis();
    let changePeriodStart = getFromStorage('last-update') || null;
    data = data.map((dp) => {
        return {
            ...dp,
            'change-period-start': changePeriodStart,
            'change-period-end': changePeriodEnd,
        };
    });
    let commentHistory = getFromStorage('comment-history') || [];
    let unmarkedData = [];
    let newNotifications = [];
    for (const dp of data) {
        let previousComments = commentHistory.filter((chdp) => chdp.id === dp.id);
        if (previousComments.length === 0) {
            //there is no previous record, so add the current data
            unmarkedData.push(dp);
            //making notification
            newNotifications.push(dp.id);
        } else {
            const recentRecord = previousComments[previousComments.length - 1];
            const commentChange = recentRecord.comment !== dp.comment;
            const pointsChange = recentRecord.points !== dp.points;
            if (commentChange || pointsChange) {
                //the comment/points record is not up to date, so add the current data
                unmarkedData.push(dp);
                //making notification
                newNotifications.push(dp.id);
            }
        }
        //else, the prior info has covered this
    }
    let notifications = getFromStorage('notifications') || [];
    setToStorage('notifications', [...notifications, ...newNotifications]);
    //updating localStorage
    commentHistory = [...commentHistory, ...unmarkedData];
    setToStorage('comment-history', commentHistory);
}

async function main() {
    if (getCurrentMillis() - getFromStorage('last-update') < TIME_BETWEEN_REQUESTS) {
        return;
    }
    let sectionIds = getFromStorage('current-classes-section-ids') || [];
    let funcs = sectionIds.map((sectionId) => {
        return new Promise(async (resolve, reject) => {
            await fetch(
                'https://francisparker.myschoolapp.com/api/datadirect/GradeBookPerformanceAssignmentStudentList/?' +
                    'sectionId=' +
                    sectionId +
                    '&markingPeriodId=' +
                    getFromStorage('marking-period-id') +
                    '&studentUserId=' +
                    getFromStorage('user-id')
            )
                .then((response) => response.json())
                .then((data) => {
                    useData(data, sectionId);
                })
                .catch(reject);
            resolve(1);
        });
    });
    await Promise.all(funcs);
    setToStorage('last-update', getCurrentMillis());
}

async function getLongQueryParameter() {
    const contextUrl = 'https://francisparker.myschoolapp.com/api/webapp/context';
    let data = await fetch(contextUrl).then((response) => response.json());
    let uid = data.UserInfo?.UserId;
    if (uid) {
        setToStorage('user-id', uid);
    }
    let currentSectionIds = data['Groups'].map((group) => group['CurrentSectionId']);
    let queryParam = [
        {
            DurationId: getFromStorage('duration-id'),
            LeadSectionList: currentSectionIds.map((id) => {
                return { LeadSectionId: id };
            }),
        },
    ];
    return queryParam;
}

//parses 'Progress' page for its data and sets localStorage
async function updateProgressPageData() {
    //gets durationId which is needed for getting the currentMarkingPeriod
    //* --Getting the Current Duration ID--
    // getting all the durationIds first
    let id = setInterval(function () {
        let triLabels = document.querySelectorAll("[data-action='term']");
        if (triLabels.length >= 3) {
            let ids = [...triLabels].map((label) => label.dataset.value);
            clearInterval(id);
            useIds(ids);
        }
    }, INTERVAL_LOAD_TIME);
    // check each durationIds for currentMarkingPeriod
    async function useIds(ids) {
        const markingPeriodUrl = 'https://francisparker.myschoolapp.com/api/gradebook/GradeBookMyDayMarkingPeriods';

        let queryParam = await getLongQueryParameter();

        for (let id of ids) {
            queryParam[0].DurationId = id;
            let queryParams = '?durationSectionList=' + JSON.stringify(queryParam) + '&userId=4667430' + '&personaId=2';
            let data = await fetch(markingPeriodUrl + queryParams).then((response) => response.json());
            let cur = data[0].CurrentMarkingPeriod;
            if (cur) {
                //setting it in the local storage
                setToStorage('duration-id', id);
                setToStorage('marking-period-id', data[0].MarkingPeriodId);
                break;
            }
        }
    }
}

//runs requests for each page load
async function updateMiscData() {
    const contextUrl = 'https://francisparker.myschoolapp.com/api/webapp/context';
    let groups = await fetch(contextUrl)
        .then((res) => res.json())
        .then((data) => data['Groups']);
    if (!groups || !groups.filter) {
        return;
    }
    groups = groups.filter((group) => {
        return (
            group['Association'] === 1 && //class, not club or other
            group['CurrentEnrollment'] === true && //current trimester (3 classes -> 1 class)
            group['Category'] !== 'US-Utility'
        ); //gets rid of free blocks
    });
    let sectionIds = groups.map((group) => group['LeadSectionId']);
    setToStorage('current-classes-section-ids', sectionIds);
    let sections = groups.map((group) => {
        return {
            sectionId: group['LeadSectionId'],
            name: group['GroupName'],
        };
    });
    setToStorage('current-sections', sections);
}

//cache reading and writing
//uses localStorage
function setToStorage(name, value) {
    let gcCache = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '{}');
    gcCache[name] = value;
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(gcCache));
}
function getFromStorage(name) {
    let gcCache = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '{}');
    return gcCache[name];
}
//sub cache reading and writing
function addToStorageCache(name1, name2, value) {
    let gcCache = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '{}');
    let subCache = gcCache[name1] || {};

    subCache[name2] = value;
    gcCache[name1] = subCache;
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(gcCache));
}
function getFromStorageCache(name1, name2) {
    let gcCache = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '{}');
    let subCache = gcCache[name1] || {};
    return subCache[name2];
}

async function addInfoPageDependencies(fun) {
    let head = document.querySelector('head');
    let script = document.createElement('script');
    script.setAttribute('src', 'https://d3js.org/d3.v6.min.js');
    script.onload = function () {
        console.log(d3);
    };
    head.appendChild(script);
}

//message listener
//receives message from background.js script
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if (request?.extension === 'grade-comment-monitor') {
        if (location.href.includes('login')) {
            return;
        }
        main();
        infoPageMain();
        if (location.href.includes('#studentmyday/progress')) {
            updateProgressPageData();
        }
        if (location.href.includes('#gc/info')) {
            addInfoPageDependencies();
            loadInfoPage();
        }
        updateMiscData();
    }
});
