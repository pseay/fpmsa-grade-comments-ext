function useData(data) {
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
    console.log(data);
}

function getData() {
    fetch(
        'https://francisparker.myschoolapp.com/api/datadirect/GradeBookPerformanceAssignmentStudentList/?sectionId=24132279&markingPeriodId=9596&studentUserId=4667430'
    )
        .then((response) => response.json())
        .then((data) => {
            // useData(data);
            console.log(data);
        });
}

async function getCurrentMarkingPeriod() {
    //context url gives lots of information about the student
    //has sections: UserInfo, Tasks, Groups (classes), Directories, Calendars, and InboxDirectories
    const contextUrl = 'https://francisparker.myschoolapp.com/api/webapp/context';
    const markingPeriodUrl = 'https://francisparker.myschoolapp.com/api/gradebook/GradeBookMyDayMarkingPeriods';
    let currentSectionIds = await fetch(contextUrl)
        .then((response) => response.json())
        .then((data) => data['Groups'].map((group) => group['CurrentSectionId']));
    let queryParam = [{
        DurationId: 128016,//TODO: find where this is from
        LeadSectionList: currentSectionIds.map(id => {
            return { LeadSectionId: id };
        })
    }]
    //gets the markingPeriodUrl endpoint with query params
    return (
        fetch(
            markingPeriodUrl + '?durationSectionList=' +
            JSON.stringify(queryParam) +
            '&userId=4667430' +
            '&personaId=2'
        )
            .then((response) => response.json())
            //comes in format: [{ ...info, MarkingPeriodId: xxxx }]
            .then((data) => console.log(data[0].MarkingPeriodId))
    );
}

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if (request?.extension === 'comment-retriever') {
        getData();
    }
});
