import React from 'react';
import LegalPage from '../../../components/legal/LegalPage';
import {SUPPORT_CONTACT} from '../../../config/support';
const sections=[
 {title:'Information we collect',body:'We collect account details, contact information, saved addresses, order activity, support messages and technical information needed to operate and secure the app.'},
 {title:'How information is used',body:'Information is used to create and manage accounts, process orders, arrange delivery, provide support, prevent fraud, improve services and meet legal obligations.'},
 {title:'Payments and delivery partners',body:'Payment details are handled by authorised payment providers. Necessary order and address information may be shared with logistics partners solely to fulfil and track deliveries.'},
 {title:'Data security',body:'We apply reasonable administrative and technical safeguards. No digital system is completely secure, so users should protect their passwords and notify support about suspected unauthorised access.'},
 {title:'Retention',body:'Information is retained only for as long as needed for service delivery, legal, tax, accounting, dispute-resolution and security purposes, after which it is deleted or anonymised where appropriate.'},
 {title:'Your choices',body:'You may update profile information and saved addresses in the app. You may contact support to request access, correction or deletion, subject to legal and operational retention requirements.'},
 {title:'Contact',body:`Privacy questions or requests can be sent to ${SUPPORT_CONTACT.email} or ${SUPPORT_CONTACT.phoneDisplay}.`},
];
export default function PrivacyPolicyScreen({navigation}){return <LegalPage navigation={navigation} title="Privacy policy" introduction="This policy explains how Big Vora collects, uses and protects information when you use the app, create an account or place an order." sections={sections}/>}
