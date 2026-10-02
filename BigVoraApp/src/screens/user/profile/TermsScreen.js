import React from 'react';
import LegalPage from '../../../components/legal/LegalPage';
import {SUPPORT_CONTACT} from '../../../config/support';
const sections=[
 {title:'Using Big Vora',body:'You must provide accurate account and delivery information, keep your login secure, and use the app only for lawful personal shopping.'},
 {title:'Products and pricing',body:'Product descriptions, availability, MRP, discounts and images are maintained carefully. We may correct genuine listing errors before dispatch and will inform you if an order is affected.'},
 {title:'Orders and payments',body:'An order is confirmed only after it is accepted by Big Vora. Online payments are processed by authorised payment partners. Cash on delivery may be unavailable for some orders or locations.'},
 {title:'Delivery',body:'Delivery estimates are indicative and may change because of address, courier, weather or operational conditions. Customers must provide a complete serviceable address and reachable phone number.'},
 {title:'Returns and replacements',body:'Eligibility depends on the product rules displayed on the relevant product page and the condition of the delivered item. Certain hygiene-sensitive, customised or final-sale items may not be returnable.'},
 {title:'Cancellations and refunds',body:'Cancellation availability depends on order status. Approved refunds are returned through the original payment channel and processing time may vary by bank or payment provider.'},
 {title:'Contact',body:`Questions about these terms can be sent to ${SUPPORT_CONTACT.email} or ${SUPPORT_CONTACT.phoneDisplay}.`},
];
export default function TermsScreen({navigation}){return <LegalPage navigation={navigation} title="Terms & conditions" introduction="These terms describe the rules for using the Big Vora app and purchasing products through it. By continuing to use the app, you agree to these terms." sections={sections}/>}
