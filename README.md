# A Little Invitation 💗

A 7-page interactive date invitation: greeting → announcement → date picker → location reveal → itinerary → her feedback → downloadable PNG invitation.

## Run it
Plain HTML/CSS/JS with no build step. Serve the folder with any static server:

```bash
python -m http.server 5173
```

Then open http://localhost:5173. To share it, upload the folder to any static host (GitHub Pages, Netlify, etc.) and send the link.

## Customize (top of `app.js`, `CONFIG`)
- `recipientName` / `senderName`
- `proposedDates`: in order, `YYYY-MM-DD`. Only Mon–Thu dates are used. Past or invalid dates are skipped (with a console warning). The last one gets the "accept it or I will kiss you" message.
- `latestHomeArrival`: if her changes push the trip home past this time, the app asks her whether that's okay.
- Itineraries live in `ITINERARIES` (durations in minutes, `fixedStart` for showtimes).

## Photo
Put a photo of SM City Angono at `assets/sm-angono.jpg`. Until you do, a drawn illustration is shown.

## Files
- `index.html`: all pages
- `styles.css`: theme and animations
- `app.js`: navigation, calendar logic, schedule engine, feedback interpretation
- `invitation.js`: draws the PNG invitation on a canvas (its height grows with the content)
