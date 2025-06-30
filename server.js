const express = require("express");
const bodyParser = require("body-parser");
const fetch = require("node-fetch");
const md5 = require("md5");
const app = express();

const MAILCHIMP_API_KEY = process.env.MAILCHIMP_API_KEY;
const MAILCHIMP_LIST_ID = process.env.MAILCHIMP_LIST_ID;
const MANDRILL_API_KEY = process.env.MANDRILL_API_KEY;
const COMPANY_EMAIL = process.env.COMPANY_EMAIL;
const FROM_EMAIL = process.env.FROM_EMAIL;

app.use(bodyParser.json());

app.post("/webhook", async (req, res) => {
  const { name, email } = req.body;

  try {
    const dc = MAILCHIMP_API_KEY.split("-")[1];
    const hash = md5(email.toLowerCase());

    await fetch(`https://${dc}.api.mailchimp.com/3.0/lists/${MAILCHIMP_LIST_ID}/members/${hash}`, {
      method: "PUT",
      headers: {
        Authorization: `apikey ${MAILCHIMP_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email_address: email,
        status_if_new: "subscribed",
        merge_fields: { FNAME: name },
      }),
    });

    await fetch("https://mandrillapp.com/api/1.0/messages/send.json", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        key: MANDRILL_API_KEY,
        message: {
          from_email: FROM_EMAIL,
          to: [{ email: COMPANY_EMAIL, type: "to" }],
          subject: "New Interakt Form Submission",
          html: `<p><strong>Name:</strong> ${name}</p><p><strong>Email:</strong> ${email}</p>`,
        },
      }),
    });

    res.status(200).send("Success");
  } catch (err) {
    console.error(err);
    res.status(500).send("Error");
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Listening on ${port}`));
