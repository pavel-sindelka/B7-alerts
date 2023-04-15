const puppeteer = require('puppeteer');
const moment = require('moment');
const nodemailer = require('nodemailer');

moment.locale('cs');

let last_timestamp = 1680767160;
const email = process.env.EMAIL;
const password = process.env.PASSWORD;
const url = 'https://disqus.com/embed/comments/?base=default&f=beskydska-sedmicka&t_u=https%3A%2F%2Fwww.beskydskasedmicka.cz%2Fb7%2Fdiskuze-nakup-prodej-zmeny%2F&t_d=Diskuze%20%E2%80%93%20n%C3%A1kup%2C%20prodej%2C%20zm%C4%9Bny%20%7C%20Beskydsk%C3%A1%20sedmi%C4%8Dka%202023&t_t=Diskuze%20%E2%80%93%20n%C3%A1kup%2C%20prodej%2C%20zm%C4%9Bny%20%7C%20Beskydsk%C3%A1%20sedmi%C4%8Dka%202023&s_o=default#version=3e54966d61d1dd2aed1b403e6aa1bc04';


async function fetchAndCheck() {
    try {
        const browser = await puppeteer.launch({
            // headless: false,
            // executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        const page = await browser.newPage();
        await page.goto(url);
        await page.waitForSelector("#post-list")

        const elements = (await page.$$('.post-body')).reverse();

        let content = ``

        for (const element of elements) {
            try {
                const date = await element.$eval('.post-meta a', el => el.title);
                const text = await element.$eval('p', el => el.innerText);

                if (new RegExp(/prod[aá]m/i).test(text)) {
                    const datumMoment = moment(date, 'D. MMMM YYYY HH:mm');
                    console.log(datumMoment.unix());

                    if (datumMoment.unix() > last_timestamp) {
                        last_timestamp = datumMoment.unix();
                        content += `${date}\n${text}\n\n`;
                        console.log(date);
                        console.log(text);
                    }
                }
            } catch {
            }
        }

        console.log(content);

        if (content) {
            await sendEmail(content);
        }

        setTimeout(async () => await browser.close(), 10000);

    } catch (error) {
        console.error(`Nepodařilo se načíst stránku: ${error.message}`);
    }
}

async function sendEmail(text) {
    try {
        const transporter = nodemailer.createTransport({
            host: 'smtp.zoho.com',
            port: 465,
            secure: true,
            auth: {
                user: email,
                pass: password
            }
        });

        const mailOptions = {
            from: email,
            to: ["sindelka95@gmail.com", "spanhel@survio.com"],
            subject: 'B7 ALERT',
            text
        };

        await transporter.sendMail(mailOptions);
        console.log('E-mail byl úspěšně odeslán');
    } catch (error) {
        console.error(`Nepodařilo se odeslat e-mail: ${error.message}`);
    }
}

fetchAndCheck();
setInterval(fetchAndCheck, 10 * 1000);
