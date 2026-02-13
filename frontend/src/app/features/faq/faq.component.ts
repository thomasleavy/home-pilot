import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

export interface FaqItem {
  question: string;
  answer: string;
}

@Component({
  selector: 'app-faq',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './faq.component.html',
  styleUrl: './faq.component.css',
})
export class FaqComponent {
  readonly faqs: FaqItem[] = [
    {
      question: 'What is Home Pilot?',
      answer:
        'Home Pilot is a smart home control app that lets you manage devices such as heating, hot water, and lights from one place. Your settings and preferences are stored per account so each user sees their own view and device state.',
    },
    {
      question: 'Why do I need to create an account?',
      answer:
        'An account keeps your device settings, heating and hot water history, and preferences (like text size) private and tied to you. When you log in on another device or after reinstalling the app, your data is still there. It also lets the system show you personalised insights.',
    },
    {
      question: 'What are Insights?',
      answer:
        'Insights show how long your heating and hot water have been on over recent days. This helps you see usage patterns and manage energy. The data is stored per account and is only visible to you when you are logged in.',
    },
    {
      question: 'What does Discover do?',
      answer:
        'Discover helps you find and add new devices to your home setup. It lists compatible devices and guides you through connecting them so they appear on your Home dashboard.',
    },
    {
      question: 'Why does it say "Disconnected" or "Poor connection"?',
      answer:
        'The app talks to a backend service that connects to your smart devices. If you see Disconnected or Poor connection, the link between the app and that service is broken or unstable. Check your internet connection and try again. If the problem continues, the service may be temporarily unavailable.',
    },
    {
      question: 'How do I control my heating and hot water?',
      answer:
        'On the Home screen you’ll see your thermostat and hot water controls. Use the buttons to turn heating or hot water on or off and to adjust settings. Changes are sent to your system immediately and are saved to your account.',
    },
    {
      question: 'What happens if I delete my account?',
      answer:
        'Deleting your account permanently removes your profile and all data we store for you (saved device state, heating and hot water history, and preferences). You will be logged out. You can register again later, but previous data cannot be recovered.',
    },
    {
      question: 'How do smart home systems like this work in general?',
      answer:
        'Apps like Home Pilot typically connect to a central hub or cloud service that talks to your devices (often over Wi‑Fi or protocols such as MQTT, Zigbee, or Z-Wave). You control devices through the app; the service sends commands and stores your preferences so everything stays in sync.',
    },
    {
      question: 'Are my details and data secure?',
      answer:
        'Your password is stored in an encrypted form and we use secure sign-in. Device commands and your preferences are sent over encrypted connections. We recommend using a strong, unique password and logging out on shared devices.',
    },
    {
      question: 'Can I use this with Alexa, Google Home, or Apple Home?',
      answer:
        'Integration with voice assistants and other ecosystems is planned or may be available via the "Connect to Alexa, Apple or Google" option in Manage. Check that section for the latest on supported platforms.',
    },
    {
      question: 'My device isn’t responding. What should I do?',
      answer:
        'First check that the app shows a good connection. Then try turning the device off and on at the wall (if safe to do so) and wait a minute. Refresh the app. If the device still doesn’t respond, the issue may be with the device or its connection to the home system rather than the app.',
    },
    {
      question: 'Why is my heating or hot water history empty?',
      answer:
        'History is built up as you use the app. If you’ve only just started or haven’t used the controls yet, there may be no data to show. Use the heating and hot water controls on Home; over time the Insights screen will fill with your usage data.',
    },
  ];
}
