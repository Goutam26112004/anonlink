export function StructuredData() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "AnonLink",
    "url": "https://anonlink.online",
    "description": "AnonLink is the #1 anonymous chat platform for private text, voice, and video conversations with strangers worldwide. No sign-up required. End-to-end encrypted.",
    "applicationCategory": "CommunicationApplication",
    "operatingSystem": "Web",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD",
      "description": "Free anonymous text chat with strangers"
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.7",
      "ratingCount": "2840",
      "bestRating": "5",
      "worstRating": "1"
    },
    "featureList": [
      "Anonymous text chat",
      "Voice chat with strangers",
      "Video chat with strangers", 
      "End-to-end encryption",
      "No registration required",
      "Gender and interest filters",
      "Friend system",
      "View-once media sharing"
    ],
    "screenshot": "https://anonlink.online/og-image.png",
    "author": {
      "@type": "Organization",
      "name": "AnonLink",
      "url": "https://anonlink.online"
    }
  };

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "Is AnonLink really anonymous?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes. AnonLink does not require any sign-up or personal information. Conversations are end-to-end encrypted and no chat logs are stored on our servers."
        }
      },
      {
        "@type": "Question",
        "name": "Do I need to create an account to chat?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "No. You can start chatting immediately as a guest without any registration. However, creating an account unlocks features like friend lists and private messaging."
        }
      },
      {
        "@type": "Question",
        "name": "Is AnonLink free to use?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes, text chat is completely free. Premium features like voice calls, video calls, and gender filters are available with a subscription."
        }
      },
      {
        "@type": "Question",
        "name": "How does AnonLink match me with strangers?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "AnonLink uses an intelligent matchmaking system that considers shared interests, language preferences, and availability to connect you with compatible strangers in seconds."
        }
      },
      {
        "@type": "Question",
        "name": "Is AnonLink safe?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "AnonLink has built-in content moderation, PII detection to protect personal information, and a reporting system. Users can block others and end chats at any time."
        }
      }
    ]
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
    </>
  );
}
