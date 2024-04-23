importScripts('https://www.gstatic.com/firebasejs/8.2.0/firebase-app.js');
importScripts('https://www.gstatic.com/firebasejs/8.2.0/firebase-messaging.js');

firebase.initializeApp({
  apiKey: 'AIzaSyBWTqbSvGpltDYFulmCCCCoqDw27RCnwfw',
  authDomain: 'sparta-f770d.firebaseapp.com',
  projectId: 'sparta-f770d',
  storageBucket: 'sparta-f770d.appspot.com',
  messagingSenderId: '367531329945',
  appId: '1:367531329945:web:f6dcf37b61a32998e42b08',
  measurementId: 'G-EXWKSS1NE7',
});
const messaging = firebase.messaging();
