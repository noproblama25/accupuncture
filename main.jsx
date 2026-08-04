// Vite entry point. Loads the existing prototype files in the same
// dependency order the original static HTML used — each one attaches its
// exports to `window` (see the Object.assign(window, {...}) at the bottom of
// every file), and the next file in the chain reads them back as bare
// globals. App.jsx renders into #root as a side effect of being imported.
import "./tweaks-panel.jsx";
import "./data.jsx";
import "./components.jsx";
import "./Login.jsx";
import "./Booking.jsx";
import "./Admin.jsx";
import "./App.jsx";
