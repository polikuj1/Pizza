-- 每天台北 23:59（pg_cron 排程時間為 UTC，故 15:59）自動把當日所有進行中訂單設為已完成。
-- 排程跑在資料庫端，跟後端服務有沒有睡著無關。
-- 取餐日在未來的預約單不動（等當天再自然結案）。
create extension if not exists pg_cron;

select cron.schedule(
  'close-day-orders',
  '59 15 * * *',
  $$
    UPDATE orders SET
      status = 3,
      served_at    = COALESCE(served_at, now()),
      completed_at = COALESCE(completed_at, now()),
      note = CASE WHEN COALESCE(note, '') = '' THEN '系統自動結單' ELSE note || '・系統自動結單' END
    WHERE status < 3
      AND (pickup_date IS NULL
           OR pickup_date <= to_char(now() AT TIME ZONE 'Asia/Taipei', 'YYYY-MM-DD'));
  $$
);

-- 維護指令：
--   select jobid, jobname, schedule, active from cron.job;
--   select * from cron.job_run_details order by start_time desc limit 10;
--   select cron.unschedule('close-day-orders');
