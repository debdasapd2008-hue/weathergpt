import { describe, expect, it } from "vitest";
import { CHAT_STYLE_LABELS, CHAT_STYLE_OPTIONS, detectChatStyle } from "./chatStyle";

describe("detectChatStyle", () => {
  it("returns auto for empty input", () => {
    expect(detectChatStyle("")).toBe("auto");
    expect(detectChatStyle("   ")).toBe("auto");
  });

  it("detects Devanagari as Hindi", () => {
    expect(detectChatStyle("आज बारिश होगी क्या?")).toBe("hindi");
  });

  it("detects Bengali script as Bengali", () => {
    expect(detectChatStyle("আজ কি বৃষ্টি হবে?")).toBe("bengali");
  });

  it("detects Tamil script as Tamil", () => {
    expect(detectChatStyle("இன்று மழை வருமா?")).toBe("tamil");
  });

  it("detects Telugu script as Telugu", () => {
    expect(detectChatStyle("ఈరోజు వర్షం వస్తుందా?")).toBe("telugu");
  });

  it("detects Kannada script as Kannada", () => {
    expect(detectChatStyle("ಇಂದು ಮಳೆ ಬರುತ್ತಾ?")).toBe("kannada");
  });

  it("detects Malayalam script as Malayalam", () => {
    expect(detectChatStyle("ഇന്ന് മഴ വരുമോ?")).toBe("malayalam");
  });

  it("detects Gujarati script as Gujarati", () => {
    expect(detectChatStyle("આજે વરસાદ આવશે?")).toBe("gujarati");
  });

  it("detects Gurmukhi script as Punjabi", () => {
    expect(detectChatStyle("ਅੱਜ ਮੀਂਹ ਪੈਣਾ ਹੈ?")).toBe("punjabi");
  });

  it("detects Odia script as Odia", () => {
    expect(detectChatStyle("ଆଜି ବର୍ଷା ହେବ କି?")).toBe("odia");
  });

  it("detects Urdu (Arabic script) as Urdu", () => {
    expect(detectChatStyle("کیا آج بارش ہوگی؟")).toBe("urdu");
  });

  it("detects Hinglish phrases", () => {
    expect(detectChatStyle("bhai kal weather kaisa rahega?")).toBe("hinglish");
    expect(detectChatStyle("aaj rain hoga kya?")).toBe("hinglish");
    expect(detectChatStyle("umbrella le jau?")).toBe("auto");
  });

  it("detects Banglish phrases", () => {
    expect(detectChatStyle("kal brishti hobe naki?")).toBe("banglish");
  });

  it("detects Tanglish phrases", () => {
    expect(detectChatStyle("inniku rain varuma?")).toBe("tanglish");
  });

  it("prefers Banglish over Hinglish for overlapping word lists", () => {
    expect(detectChatStyle("bhai kal brishti hobe naki?")).toBe("banglish");
  });

  it("returns auto for plain English", () => {
    expect(detectChatStyle("Will it rain today?")).toBe("auto");
  });
});

describe("chat style option list", () => {
  it("includes every label key", () => {
    for (const style of CHAT_STYLE_OPTIONS) {
      expect(CHAT_STYLE_LABELS[style]).toBeTruthy();
    }
  });

  it("starts with the auto option", () => {
    expect(CHAT_STYLE_OPTIONS[0]).toBe("auto");
  });
});