# Put your classroom online — NO GitHub, NO terminal, NO coding

You only need your web browser. Total time: about 15 minutes (mostly waiting).

You will use two free websites:

| Website | What it does | Cost |
| --- | --- | --- |
| **neon.com** | Stores your activities (the database) | Free |
| **vercel.com** | Runs your classroom website | Free |

> You do **not** need GitHub, and you do **not** need to type any commands.
> Everything below is clicking buttons in your browser.

---

## PART 1 — Make the database (about 4 minutes)

1. Open **https://neon.com** in a new tab.
2. Click **Sign up**. You can use **Continue with Google** — no new password to remember.
3. Choose the **Free** plan.
4. When asked for a project name, type: `english-classroom` and click **Create project**.
5. A box appears showing your **connection string**. It looks like:

   ```
   postgresql://neondb_owner:AbCdEf123456@ep-cool-name-123456.eu-central-1.aws.neon.tech/neondb?sslmode=require
   ```

6. Click the **copy** icon next to it.
7. **Paste it into a note** on your computer (Notepad, Notes, or email it to yourself).
   ⚠️ Keep it private — it is the key to your classroom data.

Leave that tab open.

---

## PART 2 — Get the project file ready (about 1 minute)

1. Go back to your classroom website in Arena.
2. Click the **`🌍 Get Own Website (ZIP)`** button (top bar), or **Share Hub → Deploy Online →**
   **`Download Project ZIP`**.
3. Your computer saves **`english-classroom-hub-source.zip`** in the **Downloads** folder.
   **Do not unzip it** — Vercel accepts the ZIP exactly as it is.

---

## PART 3 — Put the website online (about 5 minutes)

1. Open **https://vercel.com/drop** in a new tab.
2. If asked, click **Sign up** → **Continue with Google** (or email). Choose the **Hobby (free)** plan.
3. On the Vercel Drop page you will see a big dashed box that says something like
   **“Drag and drop a file, a folder, or .zip”**.
4. Open your **Downloads** folder, then **drag `english-classroom-hub-source.zip`** onto that box.
5. When it is accepted, type a name for the project, for example
   **`english-classroom`**, then click **Deploy**.
6. Wait ~1–2 minutes. When it finishes, Vercel shows a **green live address** such as:

   ```
   https://english-classroom.vercel.app
   ```

   **Copy that address into your note.** This is your real website.

> 🟡 The first version will open but show a yellow “connect your database” note.
> That is expected — do PART 4 next.

---

## PART 4 — Connect the database (about 3 minutes)

1. In Vercel, open your project (**english-classroom**).
2. Go to the **Settings** tab at the top.
3. In the left menu click **Environment Variables**.
4. Click **Create / Add New** and fill in:
   - **Key / Name:** `DATABASE_URL`
   - **Value:** paste the Neon connection string from PART 1
   - Leave the “Environments” checkboxes on **Production, Preview, Development**
5. Click **Save**.
6. Now go to the **Deployments** tab → find the top deployment → click the **⋯** (three dots)
   → click **Redeploy** → confirm **Redeploy**.
7. Wait ~1 minute for the green **Ready** status.

---

## PART 5 — Create your tables (one click, about 30 seconds)

1. In your browser address bar, type your address and add **`/api/setup`** at the end:

   ```
   https://english-classroom.vercel.app/api/setup
   ```

2. Press Enter. You should see a big green ✅ page:
   **“Your classroom database is ready”**.
3. Click **Go to my classroom →**.

> This page is safe to open again any time. It **never deletes** your activities.

---

## PART 6 — Log in as teacher (about 1 minute)

1. On your classroom page, click **Teacher Sign In** (top-right).
2. Enter the starter passcode: **`teacher123`**
3. Click **Settings** and set your **own secret passcode** (at least 4 characters).
   Type it once in “New passcode” and again in “Confirm new passcode”, then click
   **Save Classroom Settings**.
4. From now on you can **Add Activity**, **Edit** (✏️), **Publish** and **Delete** (🗑️)
   from any phone, tablet or computer — no Arena needed.

---

## PART 7 — Point your QR code to the new site

1. In your classroom click **Share Hub**.
2. On the **Links & QR Code** tab, paste **your Vercel address** into
   **Custom Web Domain / Vercel URL** and click **Save**.
3. The **QR code** and **Copy link** buttons now point to your permanent website.
4. Use **Print QR Classroom Card** for tablets.

---

## What your students do

Send them your address (or the printed QR code). They just open it and play —
no login, no password, on any device.

You can also send the two shortcuts:

- Grade 1 only: `https://your-site.vercel.app/?grade=grade1`
- Grade 3 only: `https://your-site.vercel.app/?grade=grade3`

---

## Updating the site later

- **Adding / changing activities:** nothing to deploy — just do it inside the site as teacher. It saves instantly for everyone.
- **Changing the code:** download a new ZIP from Arena, drag it onto **vercel.com/drop**,
  and when asked choose **the existing project** with the same name. Your data stays.

---

## If something goes wrong

| What you see | What it means | What to do |
| --- | --- | --- |
| Yellow “connect your classroom database” note | `DATABASE_URL` is missing | Repeat **PART 4**, then **PART 5** |
| Setup page says “Database key missing” | Same as above | Repeat **PART 4** |
| Setup page says the string is incomplete | Part of the Neon string was not copied | Copy it again from Neon → Connect, include the whole line ending in `?sslmode=require` |
| “Incorrect teacher passcode” | You already changed it | Use your new passcode. Forgotten it? In Neon open **SQL Editor** and run: `UPDATE teacher_settings SET passcode='teacher123';` |
| Vercel says “build failed” | Usually a missing variable | Add `DATABASE_URL`, then **Redeploy** |
| Students see nothing | Deployment not finished | Open the Vercel **Deployments** tab and wait for **Ready** |

---

## Good to know

- **Canva games** (`*.my.canva.site`) cannot be embedded in other websites, so their cards open in a new tab — that is normal and correct.
- **Gemini games** run inside the classroom, with a **⛶ Full Screen** and **Bigger Screen** button so nothing needs scrolling.
- **Audio:** on iPad/iPhone make sure the side **silent switch is OFF** and the volume is up.
- Uploaded PDF / Word / PowerPoint files are stored in your database. For very large files, host them on Google Drive and add them as a **Web Link** instead.
- Both Neon and Vercel free plans are enough for a classroom.
