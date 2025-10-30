Usability and Accessibility Improvements

This document outlines the main usability and accessibility improvements I implemented in the Slackr application to make it easier and more pleasant to use.

1. Keyboard Navigation

Before:
Channel items in the sidebar could only be clicked with a mouse — they weren’t accessible via keyboard.

What I did:
Added tabindex="0" to channel elements so they can be focused with Tab.
Added role="button" for screen reader support.
Added keydown handlers for Enter and Space to open the selected channel.
Added visible focus styles (blue outline) in CSS.

Result:
Users can now use Tab and Enter to switch channels without touching the mouse. This improves both accessibility and general UX.

2. In-App Notifications

Before:
Notifications relied on browser pop-ups, which are often blocked or easy to miss.

What I did:
Built a custom in-app banner system that appears in the top-right corner.
Includes avatar, channel name, and message preview.
Supports click to open channel, auto-dismiss, and manual close.
Styled with a purple gradient and smooth animations.

Result:
Users get immediate feedback for new messages without relying on browser permissions. It’s clear, quick, and fits the app’s design.

3. Offline Mode Support

Before:
The app became completely unusable when offline.

What I did:
Cached channel lists and messages in localStorage.
Added an offline indicator banner ("📡 Offline Mode").
Allowed read-only access to cached content while offline.
Synced data automatically once the connection returns.

Result:
The app still works in limited form without an internet connection — users can read cached messages and see which channels exist.

4. URL-Based Navigation (Deep Linking)

Before:
Users couldn’t share or bookmark a channel view.

What I did:
Added simple client-side routing using URL fragments (e.g. /#channel=123).
Synced current state with the URL.
Supported back/forward browser navigation.

Result:
Users can now share direct links to channels and profiles. The browser’s back and forward buttons also work properly.

5. Visual Feedback and Loading States

To make the interface feel more responsive and intuitive:
Added hover and active states to interactive elements.
Highlighted the current channel with a distinct background colour.
Added loading spinners during fetch operations.
Displayed clear error messages when something goes wrong.

6. Collapsible Sidebar

Before:
The channel sidebar was always visible, taking up screen space.

What I did:
Added a toggle button (☰) in the channel header.
On desktop: sidebar collapses smoothly to the left.
On mobile: sidebar slides in as an overlay with a backdrop.

Result:
Users can hide the sidebar when reading long messages or on small screens.

7. Long Username Handling

Before:
Long usernames could overflow or break the layout.

