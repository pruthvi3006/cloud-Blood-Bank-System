import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { apiUrl } from "../services/api.js";

const DONATION_QUOTES = [
  {
    text: "The blood you donate gives someone another chance at life. One day that someone may be a close relative, a friend, or you.",
    author: "Red Cross",
  },
  {
    text: "A life may depend on a gesture from you. Blood donation is a simple way to save lives.",
    author: "World Health Organization",
  },
  {
    text: "To the young and healthy it’s no loss. To the sick, it’s the hope of life. Donate blood.",
    author: "Anonymous",
  },
  {
    text: "Blood is the most precious gift that anyone can give to another person—the gift of life.",
    author: "Anonymous",
  },
  {
    text: "You don’t need a special reason to give blood—you just need your own reason.",
    author: "American Red Cross",
  },
  {
    text: "The finest gesture one can make is to save life by donating blood.",
    author: "Anonymous",
  },
  {
    text: "Every drop counts. Your donation can bridge the gap between crisis and recovery.",
    author: "Anonymous",
  },
  {
    text: "Heroes come in all types and sizes—and sometimes they wear a bandage on their arm.",
    author: "Anonymous",
  },
];

export default function HomePage() {
  const [banks, setBanks] = useState([]);
  const [loadingBanks, setLoadingBanks] = useState(true);
  const [banksError, setBanksError] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setBanksError("");
      setLoadingBanks(true);
      try {
        const { data } = await axios.get(apiUrl("/api/public/blood-banks"));
        if (!cancelled) setBanks(Array.isArray(data) ? data : []);
      } catch (err) {
        if (!cancelled) {
          setBanksError(err.response?.data?.message || "Could not load blood banks.");
          setBanks([]);
        }
      } finally {
        if (!cancelled) setLoadingBanks(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const featured = DONATION_QUOTES[0];
  const restQuotes = DONATION_QUOTES.slice(1);

  return (
    <div className="home-page">
      <section className="home-hero">
        <div className="home-hero-inner">
          <p className="home-eyebrow">Give hope. Give life.</p>
          <h2 className="home-hero-title">Blood donation saves lives</h2>
          <blockquote className="home-featured-quote">
            <p>&ldquo;{featured.text}&rdquo;</p>
            <footer>— {featured.author}</footer>
          </blockquote>
          <div className="home-hero-actions">
            <Link to="/register" className="home-btn home-btn-primary">
              Create account
            </Link>
            <Link to="/login" className="home-btn home-btn-outline">
              Sign in
            </Link>
          </div>
        </div>
      </section>

      <section className="home-section">
        <h2 className="home-section-title">Words that inspire</h2>
        <p className="home-section-lead">
          A few reminders of why donors and blood banks matter—every day, everywhere.
        </p>
        <div className="home-quotes-grid">
          {restQuotes.map((q, i) => (
            <article key={i} className="home-quote-card">
              <span className="home-quote-mark" aria-hidden>
                ❤
              </span>
              <p className="home-quote-text">&ldquo;{q.text}&rdquo;</p>
              <p className="home-quote-author">— {q.author}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="home-section home-banks-section">
        <h2 className="home-section-title">Blood banks on our network</h2>
        <p className="home-section-lead">
          Every registered blood bank in the system—across all cities and states. Sign in to search
          by blood group and request units.
        </p>

        {loadingBanks && <p className="home-muted">Loading blood banks…</p>}
        {banksError && <p className="error">{banksError}</p>}

        {!loadingBanks && !banksError && banks.length === 0 && (
          <p className="home-muted">
            No blood banks are registered yet. Blood bank admins can sign up and add their profile.
          </p>
        )}

        {!loadingBanks && banks.length > 0 && (
          <ul className="home-banks-grid">
            {banks.map((b) => (
              <li key={b.id} className="home-bank-card">
                <h3 className="home-bank-name">{b.name || "Blood bank"}</h3>
                <p className="home-bank-location">
                  {[b.city, b.state].filter(Boolean).join(", ") || "Location not set"}
                </p>
                {b.address ? <p className="home-bank-address">{b.address}</p> : null}
                {b.pincode ? <p className="home-bank-meta">PIN: {b.pincode}</p> : null}
                {b.contact_phone ? (
                  <p className="home-bank-phone">
                    <span className="home-bank-label">Phone</span> {b.contact_phone}
                  </p>
                ) : null}
                <p className="home-bank-units">
                  <span className="home-bank-label">Total units in stock</span>{" "}
                  <strong>{Number(b.total_units) || 0}</strong>
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="home-cta">
        <h2>Ready to find blood or manage your bank?</h2>
        <p>Log in as a user to search and request, or as an admin to update stock and respond to requests.</p>
        <div className="home-hero-actions">
          <Link to="/login" className="home-btn home-btn-primary">
            Go to login
          </Link>
        </div>
      </section>
    </div>
  );
}
