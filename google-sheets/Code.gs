/**
 * Kanak Parakh Foundation — volunteer responses → this Google Sheet
 * =================================================================
 * VERSION 4   (the Kanak Parakh menu shows "Script version 4")
 *
 * Copies volunteer responses from the app's Firestore database into a tab
 * called "Volunteers". Set-up takes about five minutes: see
 * google-sheets/SETUP.md in the project.
 *
 * How it behaves
 *   • READ-ONLY. It never writes to, or deletes from, the database.
 *   • Every 5 minutes it copies new responses and any whose status or team
 *     note changed.
 *   • Every night it does a full check, which also removes rows for
 *     responses that were deleted on the team page.
 *   • Kanak Parakh → Sync now does it immediately.
 *
 * Editing the sheet
 *   Columns from "Submitted" to "Response ID" are managed by this script and
 *   are overwritten on every sync — change status and notes on the team page
 *   instead. You can add your own columns to the RIGHT of "Response ID";
 *   they're left alone and stay with the right person even if you sort.
 */

var SCRIPT_VERSION = '4';

var CONFIG = {
  PROJECT_ID: 'kp-foundation-db18a',
  PROJECT_NUMBER: '168041609619',
  COLLECTION: 'volunteers',
  SHEET_NAME: 'Volunteers',
  SYNC_EVERY_MINUTES: 5,
  FULL_CHECK_HOUR: 2, // 2 am in the script's time zone
};

/* ---------------------------------------------------------------------------
 * Form options.
 * ⚠ These mirror src/config.ts and firestore.rules in the app. When an option
 *   is added or renamed there, update it here too and paste this file into
 *   Apps Script again. (`npm run check:options` in the app verifies all three.)
 * ------------------------------------------------------------------------- */

var HELP_CATEGORIES = [
  { id: 'education', label: 'Teaching & Education', options: {
    edu_teaching: 'Teaching students',
    edu_tutoring: 'Academic tutoring',
    edu_career_guidance: 'Career guidance',
    edu_subject_expertise: 'Subject expertise',
    edu_other: 'Other education support' } },
  { id: 'training', label: 'Training & Workshops', options: {
    trn_soft_skills: 'Soft skills',
    trn_communication: 'Communication skills',
    trn_financial_literacy: 'Financial literacy',
    trn_career_readiness: 'Career readiness',
    trn_professional: 'Professional skills',
    trn_other: 'Other training / workshop support' } },
  { id: 'digital', label: 'Digital Marketing & Social Media', specifics: 'digitalSpecifics', options: {
    dm_linkedin: 'LinkedIn',
    dm_instagram: 'Instagram',
    dm_facebook: 'Facebook',
    dm_strategy: 'Social media strategy',
    dm_paid_ads: 'Paid advertising / LinkedIn Ads',
    dm_content_strategy: 'Content strategy',
    dm_seo: 'SEO',
    dm_other: 'Other digital marketing skills' } },
  { id: 'technology', label: 'Website & Technology', specifics: 'techSpecifics', options: {
    web_development: 'Website development',
    web_maintenance: 'Website maintenance',
    web_uiux: 'UI/UX',
    web_seo: 'SEO / technical SEO',
    web_content: 'Website content',
    web_support: 'Troubleshooting / technical support',
    web_other: 'Other technology support' } },
  { id: 'video', label: 'Video & Content Production', options: {
    vid_shooting: 'Video shooting',
    vid_editing: 'Video editing',
    vid_reels: 'Reels / short-form video',
    vid_animation: 'Animation / motion graphics',
    vid_photography: 'Photography',
    vid_other: 'Other video / content production' } },
  { id: 'design', label: 'Design & Creative', options: {
    des_graphic: 'Graphic design',
    des_posters: 'Posters & creatives',
    des_presentations: 'Presentations',
    des_branding: 'Branding',
    des_illustration: 'Illustration',
    des_tools: 'Canva / Adobe tools',
    des_other: 'Other creative support' } },
  { id: 'fundraising', label: 'Fundraising & Partnerships', options: {
    fr_fundraising: 'Fundraising',
    fr_donor_outreach: 'Donor outreach',
    fr_corporate: 'Corporate partnerships',
    fr_csr: 'CSR partnerships',
    fr_sponsorships: 'Sponsorships',
    fr_events: 'Fundraising events',
    fr_networking: 'Networking / introductions' } },
];

var COMMITMENT_LABEL = {
  month: 'A few hours a month',
  w1_3: '1–3 hrs a week',
  w4_8: '4–8 hrs a week',
  w8_plus: '8+ hrs a week',
};

var TIME_LABEL = {
  weekday_mornings: 'Weekday mornings',
  weekday_evenings: 'Weekday evenings',
  weekends: 'Weekends',
  flexible: "I'm flexible",
};

var STATUS_LABEL = {
  NEW: 'New',
  CONTACTED: 'Contacted',
  JOINED: 'Joined',
  ARCHIVED: 'Archived',
};

/** Responses collected with the first version of the form. */
var LEGACY_INTEREST_LABEL = {
  education: 'Education',
  training: 'Training',
  outreach: 'Community Outreach',
  events: 'Event Management',
  fundraising: 'Fundraising',
  social_media: 'Social Media',
  content: 'Content Creation',
  digital_marketing: 'Digital Marketing',
  design: 'Design',
  branding: 'Branding',
  research: 'Research',
  strategy: 'Strategy',
};

/* ---------------------------------------------------------------------------
 * Start here
 * ------------------------------------------------------------------------- */

/**
 * Kanak Parakh → Check connection.
 * Reads one response to prove access, and reports exactly what's wrong if it can't.
 *
 * This is deliberately the first function in the file, so pressing ▶ Run in the
 * Apps Script editor runs it (Google asks for permission the first time) and
 * the result appears in the Execution log below the code.
 */
function checkConnection() {
  var lines = ['Running as: ' + runningAs_()];

  var scopes = grantedScopes_();
  if (scopes) {
    var canRead = scopes.some(function (s) { return /\/auth\/(datastore|cloud-platform)$/.test(s); });
    lines.push('Permission to read the database: ' + (canRead ? 'granted' : 'NOT granted'));
  }

  try {
    firestore_('get', '/' + CONFIG.COLLECTION + '?pageSize=1');
    lines.push('Reading volunteer responses: working');
    alert_(
      'Connection OK',
      lines.join('\n') + '\n\nEverything is set up. Choose Kanak Parakh → Turn on automatic sync.'
    );
  } catch (error) {
    lines.push('Reading volunteer responses: failed');
    alert_('Connection problem', lines.join('\n') + '\n\n' + explain_(error));
  }
}

/**
 * Shows a message in the Sheet. When run from the Apps Script editor there is
 * no Sheet on screen, so the message goes to the Execution log instead.
 */
function alert_(title, text) {
  var ui = ui_();
  if (ui) {
    ui.alert(title, text, ui.ButtonSet.OK);
  } else {
    console.log(title + '\n\n' + text);
  }
}

function ui_() {
  try {
    return SpreadsheetApp.getUi();
  } catch (notInSheet) {
    return null;
  }
}

/* ---------------------------------------------------------------------------
 * Columns — same order as the team page's CSV export.
 * ------------------------------------------------------------------------- */

var DATE_FORMAT = 'd mmm yyyy, h:mm am/pm';

function columns_() {
  var cols = [
    { header: 'Submitted', width: 150, date: true, get: function (r) { return r.createdAt; } },
    { header: 'Status', width: 95, get: function (r) { return STATUS_LABEL[r.status] || r.status || ''; } },
    { header: 'Name', width: 170, get: function (r) { return text_(r.fullName); } },
    { header: 'Phone', width: 140, get: function (r) { return r.phone ? "'" + r.phone : ''; } },
    { header: 'Email', width: 210, get: function (r) { return text_(r.email); } },
    { header: 'City', width: 110, get: function (r) { return text_(r.city); } },
  ];

  HELP_CATEGORIES.forEach(function (category) {
    cols.push({
      header: category.label,
      width: 220,
      get: function (r) {
        return (r.helpWith || [])
          .filter(function (id) { return category.options[id]; })
          .map(function (id) { return category.options[id]; })
          .join(', ');
      },
    });
    if (category.specifics) {
      cols.push({
        header: category.label + ' — specifics',
        width: 220,
        get: function (r) { return text_(r[category.specifics]); },
      });
    }
  });

  cols.push(
    { header: 'Other ways to contribute', width: 220, get: function (r) {
      var parts = [];
      if (r.otherContribution) parts.push(r.otherContribution);
      if (r.interests && r.interests.length) {
        parts.push('Earlier form: ' + r.interests.map(function (id) {
          return LEGACY_INTEREST_LABEL[id] || id;
        }).join(', '));
      }
      return text_(parts.join('\n'));
    } },
    { header: 'Time they can give', width: 150, get: function (r) { return COMMITMENT_LABEL[r.commitment] || ''; } },
    { header: "When they're free", width: 170, get: function (r) {
      return (r.preferredTimes || []).map(function (id) { return TIME_LABEL[id] || id; }).join(', ');
    } },
    { header: 'Anything more', width: 260, get: function (r) { return text_(r.message); } },
    { header: 'Team note', width: 220, get: function (r) { return text_(r.note); } },
    { header: 'Last updated', width: 150, date: true, get: function (r) { return r.updatedAt || r.createdAt; } },
    // Must stay the last managed column: rows are matched on it.
    { header: 'Response ID', width: 180, get: function (r) { return r.id; } }
  );
  return cols;
}

/**
 * Text typed into the public form is untrusted. In a spreadsheet, a value
 * starting with = + - or @ is run as a formula — "=IMPORTXML(...)" in a name
 * could quietly send this sheet's contents somewhere. A leading apostrophe
 * makes Sheets store it as plain text (and the apostrophe isn't displayed).
 */
function text_(value) {
  if (value === null || value === undefined) return '';
  var s = String(value);
  return /^[=+\-@]/.test(s) ? "'" + s : s;
}

/* ---------------------------------------------------------------------------
 * Menu and triggers
 * ------------------------------------------------------------------------- */

function onOpen() {
  var ui = ui_();
  if (!ui) {
    console.log(
      'onOpen builds the Kanak Parakh menu and only works inside the Sheet. ' +
        'Go back to your Sheet and refresh the page — the menu will appear. ' +
        'Or, here in the editor, choose checkConnection next to ▶ Run.'
    );
    return;
  }
  ui
    .createMenu('Kanak Parakh')
    .addItem('Sync now', 'menuSyncNow')
    .addItem('Full resync', 'menuFullResync')
    .addSeparator()
    .addItem('Check connection', 'checkConnection')
    .addSeparator()
    .addItem('Turn on automatic sync', 'turnOnAutomaticSync')
    .addItem('Turn off automatic sync', 'turnOffAutomaticSync')
    .addSeparator()
    .addItem('Script version ' + SCRIPT_VERSION, 'showVersion')
    .addToUi();
}

function showVersion() {
  alert_('Kanak Parakh sync — script version ' + SCRIPT_VERSION, 'Running as: ' + runningAs_());
}

function turnOnAutomaticSync() {
  try {
    var result = runSync_(true);
    removeTriggers_();
    ScriptApp.newTrigger('syncNow').timeBased().everyMinutes(CONFIG.SYNC_EVERY_MINUTES).create();
    ScriptApp.newTrigger('fullResync').timeBased().everyDays(1).atHour(CONFIG.FULL_CHECK_HOUR).create();
    alert_(
      'Automatic sync is on',
      result.total + ' response(s) are in the "' + CONFIG.SHEET_NAME + '" tab.\n\n' +
        'New and updated responses will appear within ' + CONFIG.SYNC_EVERY_MINUTES +
        ' minutes. Use Kanak Parakh → Sync now to update straight away.'
    );
  } catch (error) {
    alert_("Couldn't turn on sync", explain_(error));
  }
}

function turnOffAutomaticSync() {
  removeTriggers_();
  alert_(
    'Automatic sync is off',
    'The sheet keeps what it has. Use Kanak Parakh → Sync now to update it by hand.'
  );
}

function menuSyncNow() {
  menuRun_(false);
}

function menuFullResync() {
  menuRun_(true);
}

function menuRun_(full) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  try {
    var r = runSync_(full);
    var summary = r.added + ' added, ' + r.updated + ' updated' + (full ? ', ' + r.removed + ' removed' : '') + '.';
    if (ui_()) {
      ss.toast(summary, 'Volunteers synced', 6);
    } else {
      console.log('Volunteers synced: ' + summary);
    }
  } catch (error) {
    alert_("Couldn't sync", explain_(error));
  }
}

/** Time-driven trigger: new and changed responses. */
function syncNow() {
  runSync_(false);
}

/** Nightly trigger: everything, including removing deleted responses. */
function fullResync() {
  runSync_(true);
}

function removeTriggers_() {
  ScriptApp.getProjectTriggers().forEach(function (trigger) {
    var fn = trigger.getHandlerFunction();
    if (fn === 'syncNow' || fn === 'fullResync') ScriptApp.deleteTrigger(trigger);
  });
}

/* ---------------------------------------------------------------------------
 * Sync
 * ------------------------------------------------------------------------- */

function runSync_(full) {
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(30 * 1000)) {
    return { added: 0, updated: 0, removed: 0, total: 0, skipped: true };
  }
  try {
    var cols = columns_();
    var prepared = prepareSheet_(cols);
    var props = PropertiesService.getScriptProperties();
    var since = props.getProperty('newestUpdatedAt');

    // Column layout changed (e.g. a new form option): rebuild every row.
    if (prepared.headersChanged) full = true;

    var records = full || !since ? listAll_() : changedSince_(since);
    var result = full
      ? writeFull_(prepared.sheet, cols, records)
      : writeChanged_(prepared.sheet, cols, records);

    var newest = newestTimestamp_(records);
    if (newest && (full || !since || toMillis_(newest) > toMillis_(since))) {
      props.setProperty('newestUpdatedAt', newest);
    }
    props.setProperty('lastSyncedAt', new Date().toISOString());
    return result;
  } finally {
    lock.releaseLock();
  }
}

function prepareSheet_(cols) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(CONFIG.SHEET_NAME) || ss.insertSheet(CONFIG.SHEET_NAME);
  var headers = cols.map(function (c) { return c.header; });
  if (sheet.getMaxColumns() < headers.length) {
    sheet.insertColumnsAfter(sheet.getMaxColumns(), headers.length - sheet.getMaxColumns());
  }
  var current = sheet.getRange(1, 1, 1, headers.length).getValues()[0];
  var headersChanged = current.join('') !== headers.join('');

  if (headersChanged) {
    sheet.getRange(1, 1, 1, headers.length)
      .setValues([headers])
      .setFontWeight('bold')
      .setFontColor('#FFFFFF')
      .setBackground('#0F1E3D')
      .setVerticalAlignment('middle')
      .setWrap(true);
    sheet.setFrozenRows(1);
    sheet.setFrozenColumns(3);
    cols.forEach(function (c, i) { sheet.setColumnWidth(i + 1, c.width); });
  }
  return { sheet: sheet, headersChanged: headersChanged };
}

/** Full rebuild of the managed columns: update, add, and remove deleted responses. */
function writeFull_(sheet, cols, records) {
  var width = cols.length;
  var byId = {};
  records.forEach(function (r) { byId[r.id] = r; });

  var existing = readIds_(sheet, width);
  var removed = 0;

  // Remove rows whose response no longer exists (bottom-up keeps row numbers valid).
  for (var i = existing.length - 1; i >= 0; i--) {
    if (existing[i] && !byId[existing[i]]) {
      sheet.deleteRow(i + 2);
      existing.splice(i, 1);
      removed++;
    }
  }

  // Rewrite rows that are still present, in contiguous runs (one call per run).
  var updated = 0;
  var runStart = -1;
  var runRows = [];
  function flush() {
    if (runRows.length) {
      writeRows_(sheet, cols, runStart + 2, runRows);
      updated += runRows.length;
    }
    runStart = -1;
    runRows = [];
  }
  existing.forEach(function (id, index) {
    var record = id && byId[id];
    if (record) {
      if (runStart < 0) runStart = index;
      runRows.push(record);
      delete byId[id];
    } else {
      flush(); // a row without an ID that someone typed in — leave it alone
    }
  });
  flush();

  var added = appendRows_(sheet, cols, objectValues_(byId));
  return { added: added, updated: updated, removed: removed, total: records.length };
}

/** Incremental: only the responses that changed since the last sync. */
function writeChanged_(sheet, cols, records) {
  var width = cols.length;
  var rowOf = {};
  readIds_(sheet, width).forEach(function (id, index) {
    if (id) rowOf[id] = index + 2;
  });

  var fresh = [];
  var updated = 0;
  records.forEach(function (record) {
    if (rowOf[record.id]) {
      writeRows_(sheet, cols, rowOf[record.id], [record]);
      updated++;
    } else {
      fresh.push(record);
    }
  });
  var added = appendRows_(sheet, cols, fresh);
  return { added: added, updated: updated, removed: 0, total: Math.max(sheet.getLastRow() - 1, 0) };
}

function readIds_(sheet, width) {
  var count = sheet.getLastRow() - 1;
  if (count <= 0) return [];
  return sheet.getRange(2, width, count, 1).getValues().map(function (row) {
    return String(row[0] || '');
  });
}

function writeRows_(sheet, cols, startRow, records) {
  var values = records.map(function (record) {
    return cols.map(function (col) {
      var v = col.get(record);
      return v === null || v === undefined ? '' : v;
    });
  });
  sheet.getRange(startRow, 1, values.length, cols.length).setValues(values);
  cols.forEach(function (col, i) {
    if (col.date) sheet.getRange(startRow, i + 1, values.length, 1).setNumberFormat(DATE_FORMAT);
  });
  sheet.getRange(startRow, 1, values.length, cols.length).setVerticalAlignment('top');
}

function appendRows_(sheet, cols, records) {
  if (!records.length) return 0;
  records.sort(function (a, b) {
    return (a.createdAt ? a.createdAt.getTime() : 0) - (b.createdAt ? b.createdAt.getTime() : 0);
  });
  writeRows_(sheet, cols, sheet.getLastRow() + 1, records);
  return records.length;
}

/* ---------------------------------------------------------------------------
 * Firestore (REST, as the person who owns this Sheet)
 * ------------------------------------------------------------------------- */

var PAGE_SIZE = 300;

function listAll_() {
  var out = [];
  var pageToken = '';
  for (var page = 0; page < 200; page++) {
    var query = '?pageSize=' + PAGE_SIZE + (pageToken ? '&pageToken=' + encodeURIComponent(pageToken) : '');
    var body = firestore_('get', '/' + CONFIG.COLLECTION + query);
    (body.documents || []).forEach(function (doc) { out.push(toRecord_(doc)); });
    pageToken = body.nextPageToken;
    if (!pageToken) break;
  }
  return out;
}

function changedSince_(since) {
  var out = [];
  var seen = {};
  var cursor = since;
  for (var page = 0; page < 200; page++) {
    var rows = firestore_('post', ':runQuery', {
      structuredQuery: {
        from: [{ collectionId: CONFIG.COLLECTION }],
        where: {
          fieldFilter: {
            field: { fieldPath: 'updatedAt' },
            op: 'GREATER_THAN_OR_EQUAL',
            value: { timestampValue: cursor },
          },
        },
        orderBy: [{ field: { fieldPath: 'updatedAt' }, direction: 'ASCENDING' }],
        limit: PAGE_SIZE,
      },
    }).filter(function (row) { return row.document; });

    rows.forEach(function (row) {
      var record = toRecord_(row.document);
      if (!seen[record.id]) {
        seen[record.id] = true;
        out.push(record);
      }
    });

    if (rows.length < PAGE_SIZE) break;
    var last = rows[rows.length - 1].document.fields.updatedAt.timestampValue;
    if (last === cursor) break;
    cursor = last;
  }
  return out;
}

/**
 * Calls Firestore as the person who owns this Sheet.
 *
 * Google can attribute the request to either the Firebase project (via the
 * X-Goog-User-Project header) or to Apps Script's own hidden Cloud project.
 * Which one works depends on the account, so try one and fall back to the
 * other only for that specific kind of error, then remember what worked.
 */
function firestore_(method, path, payload) {
  var props = PropertiesService.getScriptProperties();
  var preferred = props.getProperty('quotaProjectHeader');
  var attempts = preferred === 'off' ? [false, true] : [true, false];
  var lastError = null;

  for (var i = 0; i < attempts.length; i++) {
    try {
      var body = firestoreRequest_(method, path, payload, attempts[i]);
      var worked = attempts[i] ? 'on' : 'off';
      if (preferred !== worked) props.setProperty('quotaProjectHeader', worked);
      return body;
    } catch (error) {
      lastError = error;
      if (!isProjectAttributionError_(error)) throw error;
    }
  }
  throw lastError;
}

function firestoreRequest_(method, path, payload, useQuotaProject) {
  var url = 'https://firestore.googleapis.com/v1/projects/' + CONFIG.PROJECT_ID +
    '/databases/(default)/documents' + path;
  var headers = { Authorization: 'Bearer ' + ScriptApp.getOAuthToken() };
  if (useQuotaProject) headers['X-Goog-User-Project'] = CONFIG.PROJECT_ID;

  var options = {
    method: method,
    contentType: 'application/json',
    muteHttpExceptions: true,
    headers: headers,
  };
  if (payload) options.payload = JSON.stringify(payload);

  var response = UrlFetchApp.fetch(url, options);
  var code = response.getResponseCode();
  var text = response.getContentText();
  if (code >= 300) throw googleError_(code, text);
  return JSON.parse(text);
}

/** Turns a Google API error response into an Error carrying its reason. */
function googleError_(code, text) {
  var parsed = {};
  try {
    parsed = JSON.parse(text).error || {};
  } catch (ignored) {
    parsed = { message: text };
  }
  var info = (parsed.details || []).filter(function (d) { return d && d.reason; })[0] || {};
  var error = new Error('Firestore ' + code + ' ' + (parsed.status || '') + ': ' + (parsed.message || text));
  error.status = code;
  error.googleStatus = parsed.status || '';
  error.reason = info.reason || '';
  error.consumer = (info.metadata && info.metadata.consumer) || '';
  error.googleMessage = parsed.message || text;
  return error;
}

function isProjectAttributionError_(error) {
  return /^(USER_PROJECT_DENIED|SERVICE_DISABLED|CONSUMER_INVALID|BILLING_DISABLED)$/.test(error.reason || '') ||
    /serviceusage|has not been used in project|user project/i.test(error.googleMessage || '');
}

function toRecord_(doc) {
  var record = { id: doc.name.split('/').pop() };
  var fields = doc.fields || {};
  Object.keys(fields).forEach(function (key) {
    record[key] = decode_(fields[key]);
  });
  record.updatedAtRaw = fields.updatedAt && fields.updatedAt.timestampValue;
  return record;
}

function decode_(value) {
  if (!value) return null;
  if ('stringValue' in value) return value.stringValue;
  if ('booleanValue' in value) return value.booleanValue;
  if ('integerValue' in value) return Number(value.integerValue);
  if ('doubleValue' in value) return value.doubleValue;
  if ('timestampValue' in value) return new Date(value.timestampValue);
  if ('nullValue' in value) return null;
  if ('arrayValue' in value) return (value.arrayValue.values || []).map(decode_);
  if ('mapValue' in value) {
    var out = {};
    var inner = value.mapValue.fields || {};
    Object.keys(inner).forEach(function (k) { out[k] = decode_(inner[k]); });
    return out;
  }
  return null;
}

function newestTimestamp_(records) {
  var newest = null;
  records.forEach(function (r) {
    if (r.updatedAtRaw && (!newest || toMillis_(r.updatedAtRaw) > toMillis_(newest))) {
      newest = r.updatedAtRaw;
    }
  });
  return newest;
}

function toMillis_(rfc3339) {
  return new Date(rfc3339).getTime();
}

function objectValues_(obj) {
  return Object.keys(obj).map(function (k) { return obj[k]; });
}

/** Turns API errors into something a person can act on. */
function explain_(error) {
  var account = runningAs_();
  var reason = (error && error.reason) || '';
  var status = error && error.status;
  var google = (error && error.googleMessage) || String((error && error.message) || error);
  var advice;

  if (reason === 'ACCESS_TOKEN_SCOPE_INSUFFICIENT' || /insufficient authentication scopes/i.test(google)) {
    advice =
      "Google hasn't given this script permission to read the database yet. That usually means the " +
      'permissions file (appsscript.json) wasn\'t saved before you clicked Allow.\n\n' +
      'Fix: in Apps Script, open appsscript.json, check it matches the one in the setup guide, press Ctrl+S. ' +
      'Then here, choose Kanak Parakh → Check connection and click Allow when Google asks.';
  } else if (status === 401 || error.googleStatus === 'UNAUTHENTICATED') {
    advice =
      "Google sign-in for this script didn't complete.\n\n" +
      'Fix: choose Kanak Parakh → Check connection and click Allow when Google asks.';
  } else if (reason === 'SERVICE_DISABLED' || reason === 'CONSUMER_INVALID' ||
             /has not been used in project/i.test(google)) {
    advice =
      'Google is counting this request against Apps Script\'s own hidden project instead of your ' +
      'Firebase project.\n\n' +
      'Fix: in Apps Script, click ⚙️ Project Settings → Google Cloud Platform (GCP) Project → Change project, ' +
      'enter the project number ' + CONFIG.PROJECT_NUMBER + ', and follow the prompts. Then run ' +
      'Kanak Parakh → Check connection again.';
  } else if (status === 403) {
    advice =
      'The script is running as ' + account + ', and that Google account doesn\'t have access to the ' +
      'Firebase project "' + CONFIG.PROJECT_ID + '".\n\n' +
      'Fix: open this Sheet in a browser profile signed in ONLY to the Google account that owns the ' +
      'Firebase project, set it up again from that account, or give ' + account +
      ' the "Cloud Datastore Viewer" role in Google Cloud IAM.';
  } else {
    advice = "Something unexpected went wrong talking to the database.";
  }

  return advice + '\n\n———\nScript version: ' + SCRIPT_VERSION + '\nRunning as: ' + account +
    '\nDetails: ' + [status, error && error.googleStatus, reason].filter(Boolean).join(' · ') +
    '\n' + String(google).slice(0, 300);
}

/** The Google account this script is running as. */
function runningAs_() {
  try {
    return Session.getEffectiveUser().getEmail() || 'an unknown account';
  } catch (ignored) {
    return 'an unknown account';
  }
}

/** Which permissions Google actually granted this script (from its access token). */
function grantedScopes_() {
  var response = UrlFetchApp.fetch(
    'https://oauth2.googleapis.com/tokeninfo?access_token=' + encodeURIComponent(ScriptApp.getOAuthToken()),
    { muteHttpExceptions: true }
  );
  if (response.getResponseCode() !== 200) return null;
  return String(JSON.parse(response.getContentText()).scope || '').split(/\s+/).filter(Boolean);
}

