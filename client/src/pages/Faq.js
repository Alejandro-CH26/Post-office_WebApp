import React, { useState } from "react";
import "./Faq.css";

const faqData = [
  {
    question: "How can I track my package?",
    answer: "Go to the 'Track Package' page and enter your tracking ID to view delivery status.",
  },
  {
    question: "What do I do if I forget my employee password?",
    answer: "Please contact your supervisor to reset your credentials.",
  },
  {
    question: "How do I onboard a new employee?",
    answer: "Log in as an admin and navigate to the 'Onboard Employee' section to add details.",
  },
  {
    question: "Is my information secure?",
    answer: "Yes. All data is encrypted and stored securely using modern best practices.",
  },
  {
    question: "How long does delivery usually take?",
    answer: "Most deliveries are completed within 2–5 business days depending on distance and package priority.",
  },
  {
    question: "Where can I find my tracking history?",
    answer: "You can find it in the tracking history page after logging in.",
  },
  {
    question: "Can I buy stamps or other items needed for delivery?",
    answer: "Yes. Log in and go to the Buy Stamps/Inventory page to find our currently available items up for sale.",
  },

];

function Faq() {
  const [openIndex, setOpenIndex] = useState(null);

  const toggle = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="faq-container">
      <h1 className="faq-title"> Frequently Asked Questions</h1>
      {faqData.map((item, index) => (
        <div
          key={index}
          className={`faq-item ${openIndex === index ? "open" : ""}`}
          onClick={() => toggle(index)}
        >
          <div className="faq-question">{item.question}</div>
          {openIndex === index && <div className="faq-answer">{item.answer}</div>}
        </div>
      ))}

      <div className="faq-footer">
        Still have questions?{" "}
        <a href="/contact" style={{ color: "#2c3e50", textDecoration: "underline" }}>
          Contact support
        </a>
        .
      </div>
    </div>
  );
}

export default Faq;
