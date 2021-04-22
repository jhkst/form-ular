/**************************************************/
/* Original source https://github.com/p01/mmd.js  */
/**************************************************/

function mmd(src) {
    let h='';

    let escape = (t) => new Option(t).innerHTML
    let inlineEscape = (s) => escape(s)
        .replace(/\[([^\]]+)]\(([^(]+?)\)/g, '<a href="$2" target="_blank">$1</a>')
        .replace(/`([^`]+)`/g, '<code>$1</code>')
        .replace(/(\*\*|__)(?=\S)([^\r]*?\S[*_]*)\1/g, '<strong>$2</strong>')
        .replace(/([*_])(?=\S)([^\r]*?\S)\1/g, '<em>$2</em>')
        .replace(/\n/g, '<br/>');

    src
        .replace(/^\s+|\r|\s+$/g, '')
        .replace(/\t/g, '    ')
        .split(/\n\n+/)
        .forEach((b, f, R) => {
            f=b[0];
            R= {
                    '*':[/\n\* /,'<ul><li>','</li></ul>'],
                    '1':[/\n[1-9]\d*\.? /,'<ol><li>','</li></ol>'],
                    ' ':[/\n {4}/,'<pre><code>','</code></pre>','\n'],
                    '>':[/\n> /,'<blockquote>','</blockquote>','\n']
                }[f];
            h+=
                R?R[1]+('\n'+b)
                    .split(R[0])
                    .slice(1)
                    .map(R[3]?escape:inlineEscape)
                    .join(R[3]||'</li>\n<li>')+R[2]:
                    f==='#'?'<h'+(f=b.indexOf(' '))+'>'+inlineEscape(b.slice(f+1))+'</h'+f+'>':
                        f==='<'?b:
                            '<p>'+inlineEscape(b)+'</p>';
        });
    return h;
}