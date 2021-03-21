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
    fetch("https://francisparker.myschoolapp.com/api/datadirect/GradeBookPerformanceAssignmentStudentList/?sectionId=24132279&markingPeriodId=9596&studentUserId=4667430")
        .then(response => response.json())
        .then(data => {
            useData(data);
        });
}

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if (request?.extension === 'comment-retriever') {
        getData();
    }
});
