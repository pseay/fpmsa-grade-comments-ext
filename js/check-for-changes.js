function useData(data) {
    console.log("called!!!");
    data = data.map(dp => {
        function removeTags(taggedText) {
            let span = document.createElement("span");
            span.innerHTML= taggedText;
            let text = span.textContent;
            return hashCode(text);
        };
        function hashCode(s){
            return s.split("").reduce(function(a,b){a=((a<<5)-a)+b.charCodeAt(0);return a&a},0);              
        }
        return {'id': dp.AssignmentId, 'comment': removeTags(dp.AdditionalInfo)};
    });
}

async function main() {
    /*let funcs = getFromCache("currentClassesSectionIds").map(sectionId => () => {
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
    });*/
    console.log(funcs);
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
            console.log(markingPeriodUrl + queryParams);
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
