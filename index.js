const fs = require("fs"), https = require("https"), path = require("path");

const requiredFiles = [{name: "finished.json", default: "[]"}, {name: "input.txt", default: ""}];
for(let file of requiredFiles) if(!fs.existsSync(file.name)) fs.writeFileSync(file.name, file.default);

const memes = fs.readFileSync("input.txt").toString().split("\n").filter(string => string.length > 1).map(b => b.replace("\r",""));
const finishedMemes = JSON.parse(fs.readFileSync("finished.json"));

let filenames = [];
for(let url of finishedMemes) {
    filenames.push(getFileName(url));
}

function updateMemeList() {
    fs.writeFileSync("finished.json", JSON.stringify(finishedMemes));
}

let completed = 0;
let totalMemes = 0;

function getFileName(url) {
    console.log(url);
    const filePath = url.split("/");
    let fileName = filePath[filePath.length-1].split("?")[0];
    while(filenames.includes(fileName)) fileName = "_"+fileName;

    return fileName;
}

function download(memeList, res) {
    for(let memeUrl of memeList) {
        const fileName = getFileName(memeUrl);
        filenames.push(fileName);

        if(finishedMemes.includes(memeUrl)) {
            console.log("Skipping "+fileName+" because it was previously downloaded");
            continue;
        }

        const sysFile = path.join(__dirname, "downloads", fileName).toString();
        console.log("Creating dummy file at ", sysFile);
        
        fs.writeFile(sysFile, "", (err) => {
            if(err != null) return console.log("An internal error occured when downloading " + fileName, err);
            
            https.get(memeUrl, (stream) => {

                totalMemes++;
                console.log("Downloading " + fileName)
                const file = fs.createWriteStream(sysFile);

                stream.pipe(file);

                stream.on("close", e => {
                    console.log("Finished " + fileName + "(" + Math.ceil(++completed/totalMemes * 100) + "%, "+completed+"/"+totalMemes+")");
                    if(completed == totalMemes) {
                        res()
                    }
                    finishedMemes.push(memeUrl);
                    updateMemeList();
                })
                stream.on("error", e => {
                    console.log("An error occured when downloading " + fileName, e);
                })
            })
        });
    }
}

download(memes, () => {
    console.log("\nFinished!")
});