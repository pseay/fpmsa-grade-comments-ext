function lookForHeader() {
    /*let loop = setInterval(()=>{
        let topBar = document.querySelectorAll('ul.topnav');
        topBar = topBar?.length > 1 ? topBar[1] : null;
        if (topBar) {
            clearInterval(loop);
            insertHeader(topBar);
        }
    }, 500);*/
}

/*function insertHeader(topBar) {
    if (document.querySelector("#class-links-dropdown")) return;
    let listItem = document.createElement("li");
    listItem.id="class-links-dropdown";
    listItem.style="cursor:pointer;user-select: none;";
    listItem.className="oneline parentitem";
    {
        let anchor = document.createElement("a");
        anchor.setAttribute("data-taskid",-5);
        {
            let icon = document.createElement("i");
            icon.className="fa fa-link";
            icon.style="position:relative;float:left;font-size:30px;margin: 17% 5px 0 0;";
            anchor.appendChild(icon);

            let desc = document.createElement("span");
            desc.className="desc";
            {
                let title = document.createElement("span");
                title.className="title pri-100-fgc sky-nav";
                title.innerText="Links";
                desc.appendChild(title);
            }
            anchor.appendChild(desc);

            let caret = document.createElement("span");
            caret.className="caret";
            anchor.appendChild(caret);
        }
        listItem.appendChild(anchor);
    }
    {
        let firstDiv = document.createElement("div");
        firstDiv.className="subnavtop sec-75-bordercolor white-bgc sky-nav";
        listItem.appendChild(firstDiv);

        let secondDiv = document.createElement("div");
        secondDiv.className="subnav sec-75-bordercolor white-bgc sky-nav";
        secondDiv.innerHTML='<ul><li class="first"><a href="#activitystream" data-taskid="53179" class="sec-25-bgc-hover sky-nav" data-spid="5"><span class="desc"><span class=" title black-fgc sky-nav">Recent Activity</span></span></a></li><li class="last"><a href="#archive/news" data-taskid="53250" class="sec-25-bgc-hover sky-nav"><span class="desc"><span class=" title black-fgc sky-nav">Archived Content</span></span></a></li></ul>';
        listItem.appendChild(secondDiv);
    }
    topBar.appendChild(listItem);
}*/

function lookForLinks() {
    let loop = setInterval(() => {
        waitForPageToLoad(loop);
    }, 500);
}

function waitForPageToLoad(loop) {
    let title = document.querySelector(".bb-page-heading");
    let bulletin = document.querySelector("#text_channel");
    let links = bulletin ? bulletin.querySelectorAll("a") : null;
    if (title && bulletin) {
        clearInterval(loop);
        if (links.length > 0) {
            smartLinkSearch(title, links, bulletin);
        } else {
            manualLinkSearch(title, bulletin);
        }
    }
}

function manualLinkSearch(title, bulletin) {
    let classTitle = title.innerText;
    classTitle = sanitizeTitle(classTitle);

    let textFromBulletin = bulletin.innerText;
    let zoomLinks;
    if (textFromBulletin.includes("francisparker-org.zoom.us")) {
        let regex = /https:\/\/francisparker-org.zoom.us\/j\/[0-9]*\?pwd=.*/g;
        zoomLinks = textFromBulletin.match(regex);
    }
    let indexOfOfficeHours = bulletin.innerText
        .toLowerCase()
        .indexOf("office hours");
    let indexOfFirstLink = bulletin.innerText
        .toLowerCase()
        .indexOf("francisparker-org.zoom.us");
    let f = 0,
        s = 1;
    if (indexOfOfficeHours != -1 && indexOfOfficeHours < indexOfFirstLink) {
        f = s--;
    }
    if (zoomLinks?.length == 1) {
        setClassLink(classTitle, sanitizeLink(zoomLinks[f]));
    } else if (zoomLinks?.length == 2) {
        setClassLink(classTitle, sanitizeLink(zoomLinks[f]));
        setOfficeHoursLink(classTitle, sanitizeLink(zoomLinks[s]));
    }
}

function smartLinkSearch(title, links, bulletin) {
    let classTitle = title.innerText;
    classTitle = sanitizeTitle(classTitle);

    let zoomLinks = [];
    for (let i = 0; i < links.length; i++) {
        if (links[i].href.includes("francisparker-org.zoom.us")) {
            zoomLinks.push(links[i].href);
        }
    }
    let indexOfOfficeHours = bulletin.innerText
        .toLowerCase()
        .indexOf("office hours");
    let indexOfFirstLink = bulletin.innerText
        .toLowerCase()
        .indexOf("francisparker-org.zoom.us");
    let f = 0,
        s = 1;
    if (indexOfOfficeHours != -1 && indexOfOfficeHours < indexOfFirstLink) {
        f = s--;
    }
    if (zoomLinks.length == 1) {
        setClassLink(classTitle, sanitizeLink(zoomLinks[f]));
    } else if (zoomLinks.length == 2) {
        setClassLink(classTitle, sanitizeLink(zoomLinks[f]));
        setOfficeHoursLink(classTitle, sanitizeLink(zoomLinks[s]));
    }
}

function sanitizeTitle(title) {
    //ex. Life Skills - B6AA (B6) View details
    return title.split(" View detail")[0];
}

function sanitizeLink(link) {
    //ex. input https://www.google.com/url?q=https://francisparker-org.zoom.us/j/86499950861?pwd%3DTXQ2a25Xam8rTmVJUEVrSlEvVFN2dz09&sa=D&source=calendar&ust=1601736103291000&usg=AOvVaw2_TxsVTC423j4VDEfXIHPJ
    link = link.replace("%3D", "=");
    let id = link
        .split("https://francisparker-org.zoom.us/j/")[1]
        .split("?")[0];
    let pwd = link.split("?pwd=")[1].split("#")[0].split("&")[0];
    return "https://francisparker-org.zoom.us/j/" + id + "?pwd=" + pwd;
}

function setClassLink(classTitle, link) {
    let classLinks = [];
    let classLinksFromStorage = JSON.parse(localStorage.getItem("class-links"));
    if (classLinksFromStorage) {
        classLinks = classLinksFromStorage;
    }
    let changedIt = false;
    let mapped = classLinks.map((l) => {
        let nl = l;
        if (l.classTitle === classTitle) {
            nl.link = link;
            changedIt = true;
            return nl;
        }
        return l;
    });
    classLinks = mapped;
    if (!changedIt) {
        classLinks.push({ classTitle, link });
    }
    localStorage.setItem("class-links", JSON.stringify(classLinks));
}

function setOfficeHoursLink(classTitle, link) {
    let officeHoursLinks = [];
    let officeHoursLinksFromStorage = JSON.parse(
        localStorage.getItem("office-hours-links")
    );
    if (officeHoursLinksFromStorage) {
        officeHoursLinks = officeHoursLinksFromStorage;
    }
    let changedIt = false;
    let mapped = officeHoursLinks.map((l) => {
        let nl = l;
        if (l.classTitle === classTitle) {
            nl.link = link;
            changedIt = true;
            return nl;
        }
        return l;
    });
    officeHoursLinks = mapped;
    if (!changedIt) {
        officeHoursLinks.push({ classTitle, link });
    }
    localStorage.setItem(
        "office-hours-links",
        JSON.stringify(officeHoursLinks)
    );
}

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if (request.extension === "assignment-organizer") {
        //check to see if it is this url
        lookForHeader();
        if (
            location.href.includes("/student#academicclass/") &&
            location.href.includes("bulletinboard")
        ) {
            //page is bulletin board
            lookForLinks();
        }
    }
});
