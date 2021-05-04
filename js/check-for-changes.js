const LOCAL_STORAGE_KEY = 'grade-comment-storage';

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

function infoPageMain() {
    if (!location.href.includes('#gc/info')) {
        let panel = document.querySelector('#gc-info-panel');
        if (panel) {
            panel.outerHTML = '';
        }
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
            if (badHeader) badHeader.outerHTML = '';
            if (badSpacer) badSpacer.outerHTML = '';

            let infoPanel = document.createElement('div');
            infoPanel.setAttribute('style', 'width: 100%; height: calc(100vh - 100px); margin-top: 100px;');
            infoPanel.setAttribute('id', 'gc-info-panel');
            document.querySelector('#app').children[0].appendChild(infoPanel);

            showInfoPage(infoPanel);
            clearInterval(iId);
        }
    }, 100);
}

async function showInfoPage(infoPanel) {
    infoPanel.innerHTML = "<h1 style='color: blue;'>Notifications:</h1>";
    const notifications = getFromCache('notifications') || [];
    const idLookup = getFromCache('id-lookup') || {};
    const commentHistory = getFromCache('comment-history');
    //TODO: map notifications -> notification with associated info from 'id-lookup' and 'comment-history'
    notifications.forEach((notification) => {
        infoPanel.innerHTML += '<h4>' + idLookup[notification].title + '</h4><br/>';
    });
}

function useData(data) {
    if (!data || !data?.map) return;
    data = data.map((dp) => {
        let idVal = {
            title: removeTags(dp.AssignmentShortDescription),
            total: dp.MaxPoints,
        };
        addToCacheCache('id-lookup', dp.AssignmentId, idVal);
        return { id: dp.AssignmentId, comment: removeTags(dp.AdditionalInfo), points: dp.Points };
    });
    //adding the change period start millis - end millis
    let changePeriodEnd = getCurrentMillis();
    let changePeriodStart = getFromCache('last-update') || null;
    data = data.map((dp) => {
        return {
            ...dp,
            'change-period-start': changePeriodStart,
            'change-period-end': changePeriodEnd,
        };
    });
    let commentHistory = getFromCache('comment-history') || [];
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
                //// const prevComment = commentChange ? { p_comment: recentRecord.comment } : {};
                //// const prevPoints = pointsChange ? { p_points: recentRecord.points } : {};
                newNotifications.push(dp.id);
            }
        }
        //else, the prior info has covered this
    }
    let notifications = getFromCache('notifications') || [];
    setToCache('notifications', [...notifications, ...newNotifications]);
    //updating localStorage
    commentHistory = [...commentHistory, ...unmarkedData];
    setToCache('comment-history', commentHistory);
}

async function main() {
    let fiveMin = 300000;
    if (getCurrentMillis() - getFromCache('last-update') < fiveMin) {
        return;
    }
    let sectionIds = getFromCache('current-classes-section-ids') || [];
    let funcs = sectionIds.map((sectionId) => {
        return new Promise(async (resolve, reject) => {
            await fetch(
                'https://francisparker.myschoolapp.com/api/datadirect/GradeBookPerformanceAssignmentStudentList/?' +
                    'sectionId=' +
                    sectionId +
                    '&markingPeriodId=' +
                    getFromCache('marking-period-id') +
                    '&studentUserId=' +
                    getFromCache('user-id')
            )
                .then((response) => response.json())
                .then((data) => {
                    useData(data);
                })
                .catch(reject);
            resolve(1);
        });
    });
    await Promise.all(funcs);
    setToCache('last-update', getCurrentMillis());
}

async function getLongQueryParameter() {
    const contextUrl = 'https://francisparker.myschoolapp.com/api/webapp/context';
    let data = await fetch(contextUrl).then((response) => response.json());
    let uid = data.UserInfo?.UserId;
    if (uid) {
        setToCache('user-id', uid);
    }
    let currentSectionIds = data['Groups'].map((group) => group['CurrentSectionId']);
    let queryParam = [
        {
            DurationId: getFromCache('duration-id'),
            LeadSectionList: currentSectionIds.map((id) => {
                return { LeadSectionId: id };
            }),
        },
    ];
    return queryParam;
}

//parses 'Progress' page for its data and sets localStorage "cache"
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
    }, 100);
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
                setToCache('duration-id', id);
                setToCache('marking-period-id', data[0].MarkingPeriodId);
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
    groups = groups.filter((group) => {
        return (
            group['Association'] === 1 && //class, not club or other
            group['CurrentEnrollment'] === true && //current trimester (3 classes -> 1 class)
            group['Category'] !== 'US-Utility'
        ); //gets rid of free blocks
    });
    let sectionIds = groups.map((group) => group['LeadSectionId']);
    setToCache('current-classes-section-ids', sectionIds);
}

//cache reading and writing
//uses localStorage
function setToCache(name, value) {
    let gcCache = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '{}');
    gcCache[name] = value;
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(gcCache));
}
function getFromCache(name) {
    let gcCache = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '{}');
    return gcCache[name];
}
//sub cache reading and writing
function addToCacheCache(name1, name2, value) {
    let gcCache = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '{}');
    let subCache = gcCache[name1] || {};

    subCache[name2] = value;
    gcCache[name1] = subCache;
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(gcCache));
}
function getFromCacheCache(name1, name2) {
    let gcCache = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '{}');
    let subCache = gcCache[name1] || {};
    return subCache[name2];
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
            loadInfoPage();
        }
        updateMiscData();
    }
});
