const functions = require('firebase-functions');
const admin = require('firebase-admin');
const moment = require('moment');
const { WebhookClient } = require('dialogflow-fulfillment');

admin.initializeApp();
const firestore = admin.firestore();
const patient = firestore.collection('patient')

async function addPatient(agent) {
  const {
    parameters: {
      'patient-id.original': id,
      name,
    }
  } = agent.context.get('patientregistration-followup-2');
  try {
    await patient.doc(id).set({
      name,
      createAt: moment().format(),
    });
    agent.add(`ดำเนินการลงทะเบียนให้คุณ "${name}" เรียบร้อยค่ะ`);
  } catch (error) {
    console.error(error);
    agent.add('ลงทะเบียนผิดพลาด กรุณาลองใหม่อีกครั้งค่ะ');
  }
}

async function getPatientList(agent) {
  try {
    let ans = 'รายชื่อบางส่วนนะคะ:';
    const patientList = await patient.limit(5).get()
    patientList.forEach((doc) => {
      ans = `${ans}\nรหัส ${doc.id} > คุณ ${doc.data().name}`;
    });
    agent.add(ans);
  } catch (error) {
    console.error(error);
    agent.add('ไม่สามารถเรียกดูข้อมูลได้ ณ ขณะนี้ ลองใหม่อีกครั้งนะคะ');
  }
}

exports.helloWorld = functions.https.onRequest((request, response) => {
  response.send("This is Dr.B.");
});

exports.botHook = functions.https.onRequest(async (request, response) => {
  const agent = new WebhookClient({ request, response });
  let intentMap = new Map();
  intentMap.set('Patient Registration - yes', addPatient);
  intentMap.set('Query Patient List', getPatientList);
  agent.handleRequest(intentMap);
});