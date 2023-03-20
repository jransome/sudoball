// use old dot chaining syntax for now
import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyArDxytfNhesjqKnqNXKtkMzlGNM5eR_vQ',
  authDomain: 'web-rtc-test-99220.firebaseapp.com',
  projectId: 'web-rtc-test-99220',
  storageBucket: 'web-rtc-test-99220.appspot.com',
  messagingSenderId: '255560873680',
  appId: '1:255560873680:web:c523b2e262ac39410090d5',
};

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

export const db = firebase.firestore();
