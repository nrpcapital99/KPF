# Linking volunteer responses to a Google Sheet

Takes about 5 minutes, once. After that, every response from the form shows up
in the Sheet automatically.

**How it works:** a small script inside the Sheet copies responses from the
app's database every 5 minutes. It only **reads** the database. It can't
change or delete anything there. There's no public link that strangers could
send junk to.

---

## Before you start

Use the **Google account that owns the Firebase project** (the one you use in
the Firebase console, `nrpcapital99@gmail.com`). The script reads the database
as whoever sets it up, so a different account will get "can't read the
Firebase project".

## 1. Create the Sheet

Go to [sheets.new](https://sheets.new) and name it, e.g. **KPF Volunteers**.

## 2. Open Apps Script

In the Sheet: **Extensions → Apps Script**. A code editor opens in a new tab.

## 3. Paste the script

1. Click in the editor, select everything (`Ctrl+A`) and delete it.
2. Open [`Code.gs`](Code.gs) from this folder, copy **all** of it, and paste it in.
3. At the top, rename the project from *Untitled project* to **KPF Volunteers sync**.

## 4. Paste the permissions file

1. Click the ⚙️ **Project Settings** gear on the left.
2. Tick **Show "appsscript.json" manifest file in editor**.
3. Go back to **Editor** (`< >` on the left), open **appsscript.json**, select
   everything, delete it, and paste in [`appsscript.json`](appsscript.json).
4. Press `Ctrl+S` to save.

## 5. Turn it on

1. Go back to the Sheet tab and **reload the page**. A **Kanak Parakh** menu
   appears next to Help (give it a few seconds).
2. **Kanak Parakh → Turn on automatic sync.**
3. Google asks you to authorise. Choose your account, then:
   - You'll see *"Google hasn't verified this app"*. That's expected: it's
     your own script, not a published app. Click **Advanced → Go to KPF
     Volunteers sync (unsafe)**.
   - Click **Allow**.
4. Run **Kanak Parakh → Turn on automatic sync** once more. (The first click
   only asks for permission.)

You'll see *"Automatic sync is on"*, and a **Volunteers** tab with every
response so far.

---

## Using it

| | |
|---|---|
| **New responses** | Appear within 5 minutes |
| **Status or note changed on the team page** | Updated within 5 minutes |
| **Response deleted on the team page** | Row removed overnight (or run **Full resync**) |
| **Want it right now** | **Kanak Parakh → Sync now** |

**Don't edit the managed columns** (*Submitted* through *Response ID*). They're
rewritten on every sync. Change status and notes on the team page instead.

**You can add your own columns** to the right of *Response ID*, e.g. "Assigned
to" or "Follow-up date". They're never touched, and they stay with the right
person even if you sort or filter the sheet.

**Who can see it:** anyone you share the Sheet with can see volunteers' phone
numbers and emails. Share it the way you'd share the team page.

## If something goes wrong

Start with **Kanak Parakh → Check connection**. It shows which Google account
the script is running as, whether Google granted it permission to read the
database, and, if it can't, the exact reason and what to do. The last lines
("Details: …") are what to send if you need help.

**"Google hasn't given this script permission to read the database"**: the
permissions file wasn't saved before you clicked Allow. Redo step 4, press
`Ctrl+S`, then run **Check connection** and click **Allow**.

**"The script is running as someone@… and that account doesn't have access"**:
you're signed in to more than one Google account and the Sheet used the wrong
one. Open the Sheet in a browser window signed in *only* to the account that
owns the Firebase project (an Incognito/private window works), and repeat step 5.

**The Kanak Parakh menu doesn't appear**: reload the Sheet, and wait a few
seconds after it loads.

**To stop syncing**: **Kanak Parakh → Turn off automatic sync**. The Sheet
keeps what it already has.

**After the form's options change** (new help areas, renamed options): copy
the updated `Code.gs` into Apps Script again, save, and run **Full resync**.
