const fs = require("fs").promises;

function betweenTags(text, tag, position) {
    position = position || 0;
    var index = text.indexOf(`<${tag}>`, position);
    if (index === -1) {
        return "";
    }
    return text.slice(index + tag.length + 2, text.indexOf(`</${tag}>`, position)).trim();
}

const wordClasses = ["n.", "a.", "v. t.", "v. i.", "adv.", "n. pl.", "i.", "p. p.", "v.", "interj.", "prep.", "pron.", "imp.", "conj.", "vb. n.", "p. a.", "obs. p. p.", "obs. imp.", "n. f.", "n. m.", "prefix.", "superl.", "suffix.", "a. f.", "a. m."];
const wordClassesAlt = {
    "v.t.": "v. t.",
    "v.  t.": "v. t.",
    "v. t..": "v. t.",
    "v. t. v. t.": "v. t.",
    "v.t": "v. t.",
    "v.</def> t.": "v. t.",
    "v.i.": "v. i.",
    "n.pl.": "n. pl.",
    "n.pl": "n. pl.",
    "n pl.": "n. pl.",
    "n  pl.": "n. pl.",
    "n. pl": "n. pl.",
    "n.  pl.": "n. pl.",
    "n. plural": "n. pl.",
    "n. sing.": "n.",
    "n.sing.": "n.",
    "n. sing": "n.",
    "n. fem.": "n. f.",
    "n. masc.": "n. m.",
    "n.masc.": "n. m.",
    "n. .": "n.",
    "N.": "n.",
    "n": "n.",
    "n .": "n.",
    "n..": "n.",
    "n. <?/": "n.",
    "p.": "n.",
    "p.p.": "p. p.",
    "P. p.": "p. p.",
    "p. pr.": "p. p.",
    "p.pr.": "p. p.",
    "p. p": "p. p.",
    "poss. pron.": "p. p.",
    "possessive pron.": "p. p.",
    "p.p": "p. p.",
    "p.a.": "p. a.",
    "a": "a.",
    "a. .": "a.",
    "adj.": "a.",
    "adv": "adv.",
    "ads.": "adv.",
    "ADV.": "adv.",
    "adb.": "adv.",
    "obs.imp.": "obs. imp.",
    "prep": "prep.",
    "inerj.": "interj.",
    "comj.": "conj.",
    "vb. n": "vb. n.",
    "vb.n.": "vb. n.",
    "fem. a.": "a. f.",
    "masc. a.": "a. m."
};

var logWc = "";
async function load(fileName) {
    var txt = await fs.readFile(`${__dirname}/${fileName}`, 'utf8');
    txt = txt.replace(/&or;/g, "or");

    var wt = /<\/tt>, <tt>(.+?)<\/tt>/g;
    var allWt = [...txt.matchAll(wt)];
    var uniqueWt = [];
    allWt.forEach(t => {
        var allTs = t[1].split(' or ').join('&').split('&').join(',').split(',');
        allTs = allTs.map(t => t.trim());
        if (t[1] === "n. sing. & pl." || t[1] === "n. sing & pl." || t[1] === "n.sing. & pl.") {
            allTs = ["n.", "n. pl."];
        }
        if (t[1] === "v. i. & t." || t[1] === "v. i. &  t.") {
            allTs = ["v. i.", "v. t."];
        }
        if (t[1] === "p. & a.") {
            allTs = ["a."];
        }

        allTs.forEach(wts => {
            wts = wts.trim();
            // check for alt
            if (wordClassesAlt[wts]) {
                wts = wordClassesAlt[wts];
            }
            if (uniqueWt[wts]) {
                uniqueWt[wts] += 1;
            } else {
                uniqueWt[wts] = 1;
            }
            if (logWc && wts === logWc) {
                console.log(t[1]);
            }
        });
        // console.log(t[1]);
    });

    var orderedWts = [];
    Object.keys(uniqueWt).forEach(uwt => {
        orderedWts.push({"name": uwt, "count": uniqueWt[uwt]});
    });
    orderedWts = orderedWts.sort((a, b) => b.count - a.count);
    // console.log(orderedWts);
    if (!logWc) {
        orderedWts.forEach(wc => {
            if (wordClasses.indexOf(wc.name) === -1) {
                console.log(wc);
            }
        });
        console.log(`word classes: ${Object.keys(uniqueWt).length}`);
    }

}

load('pg673.txt', 354);
