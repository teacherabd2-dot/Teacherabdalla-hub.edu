/**
 * Game HTML hardening (works in both the browser and on the server).
 *
 * Some learner devices (Arabic-locale Android / iPad) substitute non-Latin glyphs
 * for small Latin letters, and their default speech voice is Arabic, which makes
 * English words sound wrong. This module injects a small guardian script + a
 * Latin-only font stack into every HTML game so:
 *   • the document is forced to English / left-to-right,
 *   • speech synthesis always uses an English voice,
 *   • stray non-Latin letters are replaced by Latin letters,
 *   • audio is unlocked on the first tap,
 *   • spoken words are relayed to the classroom window (never blocked).
 *
 * Injection is idempotent (marker attribute), so calling it repeatedly is safe.
 */

const GUARD_MARKER = "data-wonderhub-guard";

const LATIN_FONT_STACK =
  '"Comic Sans MS","Comic Neue","Baloo 2","Trebuchet MS",Verdana,Arial,Helvetica,sans-serif';

function guardianScript(): string {
  // Kept as a plain string (no template literals) so it survives any beautifier.
  return [
    "(function(){",
    "if(document.documentElement.getAttribute('data-wonderhub-guard'))return;",
    "document.documentElement.setAttribute('data-wonderhub-guard','1');",
    "try{document.documentElement.setAttribute('lang','en');document.documentElement.setAttribute('dir','ltr');}catch(e){}",
    "try{",
    "var st=document.createElement('style');",
    "st.textContent='html,body,button,input,select,textarea,div,span,p,h1,h2,h3,h4,h5,h6,li,a,label,td,th{font-family:" + LATIN_FONT_STACK + " !important;}';",
    "(document.head||document.documentElement).appendChild(st);",
    "}catch(e){}",
    "function pickEnVoice(){try{var vs=window.speechSynthesis.getVoices()||[];var en=[];for(var i=0;i<vs.length;i++){var l=(vs[i].lang||'').toLowerCase();if(l.indexOf('en')===0)en.push(vs[i]);}",
    "if(!en.length)return null;var pref=['natural','google us english','samantha','zira','aria','jenny','google uk english','english'];",
    "for(var p=0;p<pref.length;p++){for(var j=0;j<en.length;j++){if(((en[j].name||'').toLowerCase()).indexOf(pref[p])!==-1)return en[j];}}return en[0];}catch(e){return null;}}",
    "try{",
    "var synth=window.speechSynthesis;",
    "var nativeSpeak=synth&&synth.speak;",
    "if(nativeSpeak){synth.speak=function(u){try{if(u){u.lang='en-US';var v=pickEnVoice();if(v){u.voice=v;}}}catch(e){}",
    "try{window.parent.postMessage({type:'WONDERHUB_SPEAK',text:(u&&(u.text||''))||''},'*');}catch(e){}",
    "try{return nativeSpeak.call(synth,u);}catch(e){return;}};}",
    "}catch(e){}",
    "try{",
    "if(window.SpeechSynthesisUtterance){var NativeU=window.SpeechSynthesisUtterance;",
    "var Patched=function(text){var u=new NativeU(text);try{u.lang='en-US';var v=pickEnVoice();if(v){u.voice=v;}}catch(e){}return u;};",
    "Patched.prototype=NativeU.prototype;window.SpeechSynthesisUtterance=Patched;}",
    "}catch(e){}",
    "try{window.speechSynthesis.onvoiceschanged=function(){pickEnVoice();};window.speechSynthesis.getVoices();}catch(e){}",
    "try{",
    "var AC=window.AudioContext||window.webkitAudioContext;",
    "if(AC){var unlock=function(){try{if(!window.__whAudioCtx)window.__whAudioCtx=new AC();if(window.__whAudioCtx.state==='suspended')window.__whAudioCtx.resume();}catch(e){}};",
    "document.addEventListener('touchstart',unlock,{passive:true});document.addEventListener('click',unlock,{passive:true});}",
    "}catch(e){}",
    "var BAD=/[\\u0590-\\u05FF\\u0600-\\u06FF\\u0750-\\u077F\\u08A0-\\u08FF\\u0900-\\u097F\\u0E00-\\u0E7F\\u4E00-\\u9FFF\\uAC00-\\uD7AF]/;",
    "var LATIN='abcdefghijklmnopqrstuvwxyz';",
    "function cleanNode(el){try{if(!el||el.nodeType!==1)return;var txt=(el.textContent||'').trim();",
    "if(!txt||txt.length>3)return;if(!BAD.test(txt))return;if(el.children&&el.children.length)return;",
    "var code=0;for(var i=0;i<txt.length;i++)code+=txt.charCodeAt(i);",
    "el.textContent=LATIN.charAt(code%26);el.setAttribute('data-sanitized','1');}catch(e){}}",
    "function sweep(root){try{var nodes=(root||document).querySelectorAll('button,.opt,.option,.letter,.l,.tile,.key,.choice,.card,span,div');",
    "for(var i=0;i<nodes.length&&i<500;i++)cleanNode(nodes[i]);}catch(e){}}",
    "try{new MutationObserver(function(ms){ms.forEach(function(m){var ns=m.addedNodes||[];for(var i=0;i<ns.length;i++){var n=ns[i];if(n&&n.nodeType===1){cleanNode(n);sweep(n);}}});}).observe(document.documentElement,{childList:true,subtree:true});}catch(e){}",
    "setTimeout(function(){sweep(document);},300);",
    "setTimeout(function(){sweep(document);},1200);",
    "})();",
  ].join("\n");
}

/** Removes broken characters (lone surrogates, replacement chars) from text. */
function stripBrokenCharacters(input: string): string {
  let out = "";
  for (let i = 0; i < input.length; i++) {
    const code = input.charCodeAt(i);
    if (code >= 0xd800 && code <= 0xdbff) {
      const next = input.charCodeAt(i + 1);
      if (next >= 0xdc00 && next <= 0xdfff) {
        out += input[i] + input[i + 1];
        i++;
      }
      // lone high surrogate → drop
      continue;
    }
    if (code >= 0xdc00 && code <= 0xdfff) continue; // lone low surrogate
    if (code === 0xfffd) continue; // replacement character
    out += input[i];
  }
  return out;
}

/**
 * Returns game HTML with the English audio/latin-glyph guardian attached.
 * Safe to call on server and client, and safe to call more than once.
 */
export function sanitizeGameHtml(rawHtml: string): string {
  if (!rawHtml || typeof rawHtml !== "string") return rawHtml || "";

  let html = stripBrokenCharacters(rawHtml);

  // Already hardened? Nothing else to do.
  if (html.includes(GUARD_MARKER)) return html;

  // Make sure there is an html/body element to attach to.
  const hasHtmlTag = /<html[\s>]/i.test(html);
  if (!hasHtmlTag) {
    html = `<!DOCTYPE html><html lang="en" dir="ltr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head><body>${html}</body></html>`;
  } else {
    html = html.replace(/<html([^>]*)>/i, (match, attrs: string) => {
      let cleaned = attrs
        .replace(/\slang\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/i, "")
        .replace(/\sdir\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/i, "");
      return `<html${cleaned} lang="en" dir="ltr">`;
    });
  }

  // Guarantee a charset so non-Latin bytes are never guessed.
  if (!/<meta[^>]+charset/i.test(html)) {
    html = html.replace(/<head([^>]*)>/i, `<head$1><meta charset="utf-8">`);
  }

  const injected = `<script ${GUARD_MARKER}="1">${guardianScript()}</script>`;

  if (/<\/body>/i.test(html)) {
    return html.replace(/<\/body>/i, `${injected}</body>`);
  }
  if (/<\/html>/i.test(html)) {
    return html.replace(/<\/html>/i, `${injected}</html>`);
  }
  return `${html}${injected}`;
}
