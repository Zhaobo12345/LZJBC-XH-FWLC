const fs = require('fs');
const { JSDOM } = require('jsdom');
const store = fs.readFileSync('js/flow-config-store.js', 'utf-8');
const tag = '<script src="js/flow-config-store.js"></script>';
const raw = fs.readFileSync('task-list.html', 'utf-8');
const html = raw.replace(tag, '<script>' + store + '</script>');

function boot(query) {
  return new JSDOM(html, {
    runScripts: 'dangerously',
    pretendToBeVisual: true,
    url: 'https://example.com/task-list.html' + query
  });
}
let pass = 0, fail = 0;
function check(cond, msg) { if (cond) pass++; else { fail++; console.log('FAIL: ' + msg); } }

setTimeout(() => {
  const a = boot('?level=' + encodeURIComponent('水电工作组'));
  setTimeout(() => {
    const wa = a.window, da = wa.document;
    check(wa.eval('currentFilters.level') === '水电工作组', '?level 初始化写入 currentFilters.level');
    check(da.getElementById('resultCount').textContent === '共 32 个任务',
      '?level=水电工作组 合同 17 + 临时 15 = 32，实际 ' + da.getElementById('resultCount').textContent);

    const b = boot('?role=exec');
    setTimeout(() => {
      const wb = b.window, db = wb.document;
      check(wb.eval('currentFilters.role') === 'exec', '?role=exec 初始化写入 currentFilters.role');
      check(!!db.querySelector('#roleFilterBar .quick-filter-btn[data-role="exec"].active'), '?role=exec 胶囊高亮');

      const c = boot('?mine=1');
      setTimeout(() => {
        const wc = c.window, dc = wc.document;
        check(wc.eval('currentFilters.mine') === true, '?mine=1 初始化写入 currentFilters.mine');
        check(!!dc.querySelector('#roleFilterBar .quick-filter-btn[data-role="mine"].active'), '?mine=1 胶囊高亮');
        console.log('\n==== URL contract: ' + pass + ' PASS / ' + fail + ' FAIL ====');
        process.exit(fail ? 1 : 0);
      }, 60);
    }, 60);
  }, 60);
}, 60);
