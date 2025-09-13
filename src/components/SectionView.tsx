import React, { useRef, useCallback, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';
import { useBook } from '../contexts/BookContext';
import { EpubSection } from '../types/epub';

interface SectionViewProps {
  section: EpubSection;
  onLoad?: () => void;
  onScroll?: (progress: number) => void;
  onLinkPress?: (href: string) => void;
}

export default function SectionView({ 
  section, 
  onLoad, 
  onScroll, 
  onLinkPress 
}: SectionViewProps): React.ReactElement {
  const webViewRef = useRef<WebView>(null);
  const { settings, updatePosition } = useBook();

  const generateCSS = useCallback(() => {
    const { theme, fontSize, fontFamily, lineHeight, margin, textAlign, isRTL } = settings;
    
    // Theme colors
    const themes = {
      light: {
        background: '#ffffff',
        text: '#000000',
        link: '#0066cc'
      },
      dark: {
        background: '#1a1a1a',
        text: '#e0e0e0',
        link: '#4d9fff'
      },
      sepia: {
        background: '#f4f1ea',
        text: '#5c4b37',
        link: '#8b4513'
      }
    };

    const currentTheme = themes[theme];

    return `
      <style>
        :root {
          --background-color: ${currentTheme.background};
          --text-color: ${currentTheme.text};
          --link-color: ${currentTheme.link};
          --font-size: ${fontSize}%;
          --font-family: ${fontFamily === 'system' ? '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' : fontFamily};
          --line-height: ${lineHeight};
          --margin: ${margin}px;
          --text-align: ${textAlign};
          --direction: ${isRTL ? 'rtl' : 'ltr'};
        }

        * {
          box-sizing: border-box;
        }

        html, body {
          margin: 0;
          padding: 0;
          background-color: var(--background-color);
          color: var(--text-color);
          font-family: var(--font-family);
          font-size: var(--font-size);
          line-height: var(--line-height);
          direction: var(--direction);
          -webkit-text-size-adjust: none;
          text-size-adjust: none;
        }

        body {
          padding: var(--margin);
          margin: 0;
          text-align: var(--text-align);
        }

        /* Typography */
        h1, h2, h3, h4, h5, h6 {
          color: var(--text-color);
          margin: 1.5em 0 0.5em 0;
          line-height: 1.2;
        }

        h1 { font-size: 1.8em; }
        h2 { font-size: 1.5em; }
        h3 { font-size: 1.3em; }
        h4 { font-size: 1.1em; }

        p {
          margin: 0 0 1em 0;
          text-align: var(--text-align);
        }

        /* Links */
        a {
          color: var(--link-color);
          text-decoration: underline;
        }

        /* Images */
        img {
          max-width: 100%;
          height: auto;
          display: block;
          margin: 1em auto;
        }

        /* Tables */
        table {
          width: 100%;
          border-collapse: collapse;
          margin: 1em 0;
        }

        th, td {
          border: 1px solid var(--text-color);
          padding: 0.5em;
          text-align: left;
        }

        /* Lists */
        ul, ol {
          padding-left: 2em;
          margin: 1em 0;
        }

        li {
          margin: 0.5em 0;
        }

        /* Block quotes */
        blockquote {
          margin: 1em 0;
          padding: 0 1em;
          border-left: 3px solid var(--link-color);
          font-style: italic;
        }

        /* Code */
        code, pre {
          font-family: 'Courier New', monospace;
          background-color: ${theme === 'dark' ? '#2a2a2a' : '#f5f5f5'};
          padding: 0.2em 0.4em;
          border-radius: 3px;
        }

        pre {
          padding: 1em;
          overflow-x: auto;
          margin: 1em 0;
        }

        /* Remove default margins from first and last elements */
        *:first-child {
          margin-top: 0 !important;
        }

        *:last-child {
          margin-bottom: 0 !important;
        }

        /* Smooth scrolling for anchors */
        html {
          scroll-behavior: smooth;
        }

        /* Touch targets for mobile */
        a, button {
          min-height: 44px;
          min-width: 44px;
          display: inline-flex;
          align-items: center;
        }

        /* Reading enhancements */
        .reading-width {
          max-width: 700px;
          margin: 0 auto;
        }

        /* Handle RTL languages */
        [dir="rtl"] {
          text-align: right;
        }

        [dir="rtl"] blockquote {
          border-left: none;
          border-right: 3px solid var(--link-color);
        }

        [dir="rtl"] ul, [dir="rtl"] ol {
          padding-right: 2em;
          padding-left: 0;
        }
      </style>
    `;
  }, [settings]);

  const generateHTML = useCallback(() => {
    console.log('SectionView - Generating HTML for section:', {
      id: section.id,
      title: section.title,
      contentLength: section.content?.length || 0,
      contentPreview: section.content?.substring(0, 200) + '...',
      isFullHTML: section.content?.includes('<!DOCTYPE html>') || section.content?.includes('<html')
    });
    
    const css = generateCSS();
    const processedContent = processContent(section.content);
    
    console.log('SectionView - Processed content length:', processedContent.length);
    
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
          <title>${section.title}</title>
          ${css}
        </head>
        <body>
          <div class="reading-width">
            ${processedContent}
          </div>
          <script>
            // Handle link clicks
            document.addEventListener('click', function(e) {
              if (e.target.tagName === 'A') {
                e.preventDefault();
                const href = e.target.getAttribute('href');
                if (href) {
                  window.ReactNativeWebView.postMessage(JSON.stringify({
                    type: 'linkClick',
                    href: href
                  }));
                }
              }
            });

            // Track scroll progress
            let scrollTimer;
            function handleScroll() {
              clearTimeout(scrollTimer);
              scrollTimer = setTimeout(() => {
                const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
                const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
                const progress = scrollHeight > 0 ? scrollTop / scrollHeight : 0;
                
                window.ReactNativeWebView.postMessage(JSON.stringify({
                  type: 'scroll',
                  progress: Math.max(0, Math.min(1, progress))
                }));
              }, 100);
            }

            window.addEventListener('scroll', handleScroll);
            
            // Notify when loaded
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'loaded'
            }));
          </script>
        </body>
      </html>
    `;
  }, [section, generateCSS]);

  const processContent = useCallback((content: string): string => {
    if (!content) return '';
    
    console.log('SectionView - Processing content, original length:', content.length);
    
    // If content is already a complete HTML document, extract the body content
    if (content.includes('<!DOCTYPE html>') || content.includes('<html')) {
      // Extract body content if it's a full HTML document - use non-greedy match with dotall flag
      const bodyMatch = content.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
      if (bodyMatch) {
        console.log('SectionView - Extracted body content, length:', bodyMatch[1].length);
        return bodyMatch[1].trim();
      }
      
      // If no body tag, try to extract everything after head
      const headEndMatch = content.match(/<\/head>\s*([\s\S]*?)(?:<\/html>|$)/i);
      if (headEndMatch) {
        console.log('SectionView - Extracted content after head, length:', headEndMatch[1].length);
        return headEndMatch[1].trim();
      }
    }
    
    // For other content, do minimal processing
    let processed = content.replace(/<\?xml[^>]*\?>/g, '');
    processed = processed.replace(/<!DOCTYPE[^>]*>/g, '');
    
    // Process image sources to use local paths
    processed = processed.replace(/src=["']([^"']+)["']/g, (match, src) => {
      // Convert relative paths to use the local asset structure
      if (!src.startsWith('http') && !src.startsWith('data:')) {
        // Handle OEBPS paths
        if (src.startsWith('OEBPS/')) {
          return `src="file://${src}"`;
        } else if (src.startsWith('./') || !src.includes('/')) {
          return `src="file://OEBPS/${src.replace('./', '')}"`;
        }
      }
      return match;
    });
    
    console.log('SectionView - Final processed content length:', processed.length);
    return processed;
  }, []);

  const handleMessage = useCallback((event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      
      switch (data.type) {
        case 'loaded':
          onLoad?.();
          break;
        case 'scroll':
          onScroll?.(data.progress);
          updatePosition({ scrollProgress: data.progress });
          break;
        case 'linkClick':
          onLinkPress?.(data.href);
          break;
      }
    } catch (error) {
      console.warn('Failed to parse WebView message:', error);
    }
  }, [onLoad, onScroll, onLinkPress, updatePosition]);

  const html = generateHTML();

  return (
    <View style={styles.container}>
      <WebView
        ref={webViewRef}
        source={{ html }}
        style={styles.webView}
        onMessage={handleMessage}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        allowsFullscreenVideo={false}
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
        bounces={false}
        scrollEnabled={true}
        automaticallyAdjustContentInsets={false}
        contentInsetAdjustmentBehavior="never"
        allowsInlineMediaPlayback={true}
        mediaPlaybackRequiresUserAction={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  webView: {
    flex: 1,
    backgroundColor: 'transparent',
  },
}); 