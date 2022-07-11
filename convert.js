const fs = require("fs").promises;
const char = [
    [/\\'3ca\\'3e/g, "α"],
    [/\\'3cb\\'3e/g, "β"],
    [/\\'3cr\\'3e/g, "ρ"],
    [/\\'3cx\\'3e/g, "ξ"],
    [/\\'3cs\\'3e/g, "σ"],
    [/\\'3c/g, ","],
    [/\\'3e/g, "."],
    [/\\'80/g, "Ç"],
    [/\\'81/g, "ū"],
    [/\\'82/g, "é"],
    [/\\'83/g, "â"],
    [/\\'84/g, "ä"],
    [/\\'85/g, "à"],
    [/\\'86/g, "å"],
    [/\\'87/g, "ç"],
    [/\\'89/g, "ë"],
    [/\\'88/g, "ê"],
    [/\\'8a/g, "è"],
    [/\\'8b/g, "ï"],
    [/\\'8c/g, "î"],
    [/\\'8d/g, "ì"],
    [/\\'90/g, "é"],
    [/\\'91/g, "æ"],
    [/\\'92/g, "Æ"],
    [/\\'93/g, "ô"],
    [/\\'94/g, "ö"],
    [/\\'95/g, "ò"],
    [/\\'96/g, "û"],
    [/\\'97/g, "ù"],
    [/\\'9a/g, "Ü"],
    [/\\'9c/g, "£"],
    [/\\'a0/g, "Á"],
    [/\\'a1/g, "í"],
    [/\\'a2/g, "ó"],
    [/\\'a3/g, "ú"],
    [/\\'a4/g, "ñ"],
    [/\\'a6/g, "⅔"],
    [/\\'a7/g, "⅓"],
    [/\\'ab/g, "½"],
    [/\\'ac/g, "¼"],
    [/\\'b5/g, "☞"],
    [/\\'b6/g, "″"],
    [/\\'b7/g, "′"],
    [/\\'be/g, "ā"],
    [/\\'bf/g, "‘"],
    [/\\'c3/g, "-"],
    [/\\'c5/g, "t"],
    [/\\'c6/g, "ī"],
    [/\\'c7/g, "ē"],
    [/\\'c8/g, "d"],
    [/\\'c9/g, "n"],
    [/\\'cb/g, "ĕ"],
    [/\\'cc/g, "ĭ"],
    [/\\'ce/g, "ŏ"],
    [/\\'cf/g, "-"],
    [/\\'d0/g, "—"],
    [/\\'d1/g, "Œ"],
    [/\\'d2/g, "œ"],
    [/\\'d3/g, "ō"],
    [/\\'d4/g, "ū"],
    [/\\'d6/g, "ǣ"],
    [/\\'dc/g, "ŭ"],
    [/\\'dd/g, "ă"],
    [/\\'de/g, "⌣"],
    [/\\'df/g, "ȳ"],
    [/\\'dh/g, "‖"],
    [/\\'eb/g, "ð"],
    [/\\'ed/g, "þ"],
    [/\\'ee/g, "ã"],
    [/\\'ef/g, "n"],
    [/\\'f0/g, "r"],
    [/\\'f4/g, "ȝ"],
    [/\\'f5/g, "—"],
    [/\\'f6/g, "÷"],
    [/\\'f7/g, ""], // no idea what this is supposed to be
    [/\\'f8/g, "°"],
    [/\\'fb/g, "√"]
];

function decode(txt) {
    txt = txt.replace("<asp><?/sophagus</asp>", "<asp>œsophagus</asp>");
    txt = txt.replace(/\\'3c--.*--\\'3e/g, ""); // these seem to be hidden notes
    char.forEach(r => {
        txt = txt.replace(r[0], r[1]);
    });

    return txt;
}

function betweenTags(text, tag, position) {
    position = position || 0;
    var index = text.indexOf(`<${tag}>`, position);
    if (index === -1) {
        return "";
    }
    return text.slice(index + tag.length + 2, text.indexOf(`</${tag}>`, position)).trim();
}

function toMd(line) {
    return line
        .replace(/<i>(.+?)<\/i>/g, "*$1*")
        .replace(/<spn>(.+?)<\/spn>/g, "*$1*")
        .replace(/<ets>(.+?)<\/ets>/g, "*$1*")
        .replace(/<ex>(.+?)<\/ex>/g, "*$1*")
        .replace(/<asp>(.+?)<\/asp>/g, "*$1*")
        .replace(/<b>(.+?)<\/b>/g, "**$1**s")
        .replace(/<tt>(.+?)<\/tt>/g, "`$1`")
        .replace(/<as>/g, "")
        .replace(/<\/as>/g, "")
        .replace(/<altname>/g, "")
        .replace(/<\/altname>/g, "")
        .replace(/<contr>/g, "")
        .replace(/<\/contr>/g, "")
        .replace(/<note>/g, "")
        .replace(/<\/note>/g, "")
        .replace(/<altsp>/g, "")
        .replace(/<\/altsp>/g, "")
        .replace(/<er>(.+?)<\/er>/g, "[$1](#$1)");
}

function getDef(text) {
    var def = {};
    if (text.indexOf("<mark>") > -1) {
        def.mark = betweenTags(text, "mark");
        text = text.replace(/<mark>.+?<\/mark>/, "");
    }
    if (text.indexOf("<fld>") > -1) {
        def.fld = betweenTags(text, "fld");
    }
    var index = text.indexOf(`<def>`);
    if (index === -1) {
        def.txt = text.replace("</def>", "");
    } else {
        def.txt = toMd(text.slice(index + 5).replace("</def>", "").trim());
    }
    return def;
}

function parseFirst(line) {
    var defData = {
        pronounciation: [],
        defs: []
    };
    var hws = [];
    if (line.slice(0, 8) === '<hw><hw>') {
        hws = line.slice(0, line.lastIndexOf("<hw>")).split(",");
        hws.forEach(p => {
            if (!p) {
                return;
            }
            defData.pronounciation.push(betweenTags(p, 'hw'));
        });
    } else {
        defData.pronounciation.push(line.slice(4, line.indexOf("</hw>")));
    }
    // get grammar class, first definition, etymology, and more
    if (line.indexOf("<wordforms>") > -1) {
        defData.wordforms = toMd(betweenTags(line, 'wordforms'));
        if (defData.wordforms.slice(0, 1) === "[") {
            defData.wordforms = defData.wordforms.slice(1).trim();
        }
        if (defData.wordforms.slice(-1) === "]") {
            defData.wordforms = defData.wordforms.slice(0, -1).trim();
        }
    }
    if (line.indexOf("<def>") > -1) {
        defData.defs.push(getDef(line));
    }
    if (line.indexOf("<ety>") > -1) {
        defData.ety = toMd(betweenTags(line, 'ety'));
        if (defData.ety.slice(0, 1) === "[") {
            defData.ety = defData.ety.slice(1).trim();
        }
        if (defData.ety.slice(-1) === "]") {
            defData.ety = defData.ety.slice(0, -1).trim();
        }
    }
    // wordClass
    var first = line.indexOf("<tt>");
    var start = line.indexOf("<tt>", first + 1);
    if (start === -1) {
        start = first;
    }
    defData.wordClass = betweenTags(line, "tt", start);
    if (wordClasses.indexOf(defData.wordClass) === -1) {
        delete defData.wordClass;
    } else {
        if (defData.wordClass === "v.t") {
            defData.wordClass = "v. t.";
        }
        if (defData.wordClass === "v.i") {
            defData.wordClass = "v. i.";
        }
    }
    log[log.length - 1] = `${log[log.length - 1]} ${defData.wordClass || ""}`;

    return defData;
}

function formatDef(def) {
    var defData = {};
    var firstLine;

    // defData.def = cleanLine(def);
    def = def.split('\r\n');
    def.forEach(line => {
        if (line.slice(0, 5) === '<syn>') {
            defData.syn = {};
            defData.syn.text = betweenTags(line, 'syn');
            defData.syn.text = defData.syn.text.replace("Syn. -- ", "");
            defData.syn.text = toMd(defData.syn.text);
            if (line.indexOf("<usage>") > -1) {
                defData.syn.usage = betweenTags(line, 'usage');
                if (defData.syn.usage.slice(0, 2) === '--') {
                    defData.syn.usage = defData.syn.usage.slice(2).trim();
                }
                defData.syn.usage = toMd(defData.syn.usage);
            }
            return;
        }
        if (line.slice(0, 4) === '<hw>') {
            firstLine = parseFirst(line);
            defData.pronounciation = firstLine.pronounciation;
            defData.defs = firstLine.defs;
            defData.ety = firstLine.ety;
            defData.wordforms = firstLine.wordforms;
            defData.wordClass = firstLine.wordClass;
            return;
        }
        if (/^<p><b>\d{1,2}\.<\/b>/.test(line)) {
            defData.defs.push(getDef(line));
        }
    });
    return defData;
}

const wordClasses = ["n.", "v. t.", "v.t.", "v. i.", "v.i.", "a.", "adv.", "prep.", "n. pl.", "pron."];

var log = [];
async function load(fileName) {
    var txt = await fs.readFile(`${__dirname}/${fileName}`, 'utf8');
    txt =  decode(txt);
    var json = txt.split("<h1>");
    var dict = {};
    var word;

    json.forEach((line, lineNum) => {
        // var ii;
        var stopAt = 200;
        // var stopped = false;
        if (lineNum === 0 || (stopAt && lineNum > stopAt)) {
            return;
        }
        word = line.slice(0, line.indexOf("</h1>")).split(' or ').join(',').split(',');
        word.forEach((w, i) => {
            w = w.trim();
            if (wordClasses.indexOf(w.trim()) > -1) {
                return;
            }
            if (i === 0) {
                if (!dict[w]) {
                    dict[w] = [];
                }
                log.push(w);
                // need to add mark, quote, note, fld
                dict[w].push(formatDef(line));
                return;
            }

            if (!dict[w]) {
                dict[w] = [];
            }
            dict[w].push({"see": word[0]});
            // also create "see" for words with weird letters: Æ, Œ, etc.
        });
    });

    await fs.writeFile(`${__dirname}/websters-1913.json`, JSON.stringify(dict, null, "    "));
    await fs.writeFile(`${__dirname}/log.txt`, log.join("\n"));
}

load('pg673.txt', 354);
