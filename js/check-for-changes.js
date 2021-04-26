function getCurrentMillis() {
    return Date.parse(new Date());
}

function removeTags(taggedText) {
    let span = document.createElement("span");
            span.innerHTML= taggedText;
            let text = span.textContent;
            return text;
}

function hashCode(text) {
    return s.split("").reduce(function(a,b){a=((a<<5)-a)+b.charCodeAt(0);return a&a},0);              
}

function useData(data) {
    data = data.map((dp) => {
        let idVal = {
            title: removeTags(dp.AssignmentShortDescription),
            total: dp.MaxPoints,
        };
        addToCacheCache('id-lookup', dp.AssignmentId, idVal);
        return { id: dp.AssignmentId, comment: removeTags(dp.AdditionalInfo), points: dp.Points };
    });
    let changePeriodEnd = getCurrentMillis();
    let changePeriodStart = getFromCache('change-period-start') || null;
    data = data.map((dp) => {
        return {
            ...dp,
            'change-period-start': changePeriodStart,
            'change-period-end': changePeriodEnd,
        };
    });
    let commentHistory = getFromCache('comment-history') || [];
    let unmarkedData = [];
    for (const dp of data) {
        //TODO: generate notification list
        let previousComments = commentHistory.filter((chdp) => chdp.id === dp.id);
        if (previousComments.length === 0) {
            //there is no previous record, so add the current data
            unmarkedData.push(dp);
            //TODO: make new notification...
            //* new grade and ?comment
        } else {
            let recentRecord = previousComments[previousComments.length - 1];
            if (recentRecord.comment !== dp.comment) {
                //the comment record is not up to date, so add the current data
                unmarkedData.push(dp);
                //TODO: make new notification
                //* new comment
                //* get previous comment and show change "... -> ..."
            }
        }
        //else, the prior info has covered this
    }
    //updating localStorage
    commentHistory = [...commentHistory, ...unmarkedData];
    setToCache("comment-history", commentHistory);
    console.log(commentHistory);
}

async function main() {
    let funcs = getFromCache("currentClassesSectionIds").map(sectionId => {
        return async() => {
            fetch(
            'https://francisparker.myschoolapp.com/api/datadirect/GradeBookPerformanceAssignmentStudentList/?' + 
            'sectionId=' + sectionId +
            '&markingPeriodId=' + getFromCache("markingPeriodId") +
            '&studentUserId=' + getFromCache("userId")
            )
                .then((response) => response.json())
                .then((data) => {
                    useData(data);
                });
        };
    });
    funcs.forEach(func => func());
    await Promise.all(funcs);
    setToCache('last-update', getCurrentMillis());
}

async function getLongQueryParameter() {
    const contextUrl = 'https://francisparker.myschoolapp.com/api/webapp/context';
    let data = await fetch(contextUrl)
        .then((response) => response.json());
    let uid = data.UserInfo?.UserId;
    if (uid) {
        setToCache("userId", uid);
    }
    let currentSectionIds = data['Groups'].map((group) => group['CurrentSectionId']);
    let queryParam = [
        {
            DurationId: getFromCache("durationId"),
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
    let id = setInterval(function() {
        let triLabels = document.querySelectorAll("[data-action='term']");
        if (triLabels.length >= 3) {
            let ids = [...triLabels].map(label => label.dataset.value);
            clearInterval(id);
            useIds(ids);
        }
    }, 1000);
    // check each durationIds for currentMarkingPeriod
    async function useIds(ids) {

        const markingPeriodUrl = 'https://francisparker.myschoolapp.com/api/gradebook/GradeBookMyDayMarkingPeriods';

        let queryParam = await getLongQueryParameter();

        for (let id of ids) {
            queryParam[0].DurationId=id;
            let queryParams = '?durationSectionList=' + JSON.stringify(queryParam) + '&userId=4667430' + '&personaId=2';
            let data = await fetch( markingPeriodUrl + queryParams )
                .then((response) => response.json());
            let cur = data[0].CurrentMarkingPeriod;
            if (cur) {
                //setting it in the local storage
                setToCache("durationId", id);
                setToCache("markingPeriodId", data[0].MarkingPeriodId);
                break;
            }
        };
    }
}

//runs requests for each page load
async function updateMiscData() {
    const contextUrl = 'https://francisparker.myschoolapp.com/api/webapp/context';
    let groups = await fetch(contextUrl)
        .then(res => res.json())
        .then(data => data["Groups"]);
    groups = groups.filter(group => {
        return group["Association"] === 1          //class, not club or other
            && group["CurrentEnrollment"] === true //current trimester (3 classes -> 1 class)
            && group["Category"] !== "US-Utility"; //gets rid of free blocks
    });
    let sectionIds = groups.map(group => group["LeadSectionId"]);
    setToCache("currentClassesSectionIds", sectionIds);
}

//cache reading and writing
//uses localStorage
function setToCache(name, value) {
    let gcCache = JSON.parse(localStorage.getItem('grade-comments-cache') || "{}");
    gcCache[name] = value;
    localStorage.setItem('grade-comments-cache', JSON.stringify(gcCache));
}
function getFromCache(name) {
    let gcCache = JSON.parse(localStorage.getItem('grade-comments-cache') || "{}");
    return gcCache[name];
}
//sub cache reading and writing
function addToCacheCache(name1, name2, value) {
    let gcCache = JSON.parse(localStorage.getItem('grade-comments-cache') || "{}");
    let subCache = gcCache[name1] || {};

    subCache[name2] = value;
    gcCache[name1] = subCache;
    localStorage.setItem('grade-comments-cache', JSON.stringify(gcCache));
}
function getFromCacheCache(name1, name2) {
    let gcCache = JSON.parse(localStorage.getItem('grade-comments-cache') || "{}");
    let subCache = gcCache[name1] || {};
    return subCache[name2];
}

//message listener
//receives message from background.js script
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if (request?.extension === 'grade-comment-monitor') {
        main();
        if (location.href.includes('#studentmyday/progress')) {
            updateProgressPageData();
        }
        updateMiscData();
    }
});
