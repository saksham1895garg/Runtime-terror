-- 1. DUPLICATE PREDICTION PREVENTION
ALTER TABLE public.risk_predictions
ADD CONSTRAINT uq_risk_predictions_run_grid UNIQUE (run_id, grid_code);

-- 2. SINGLE ACTIVE RUN PROTECTION (ADVISORY LOCK RPC)
CREATE OR REPLACE FUNCTION public.start_full_prediction_run(
    p_model_name text,
    p_model_version text,
    p_total_cells integer
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS 
DECLARE
    v_run_id uuid;
    v_active_count integer;
    v_actual_cells integer;
BEGIN
    -- 1. Validate Authoritative Grid Count
    SELECT count(*) INTO v_actual_cells FROM public.analysis_grid_cells;
    IF v_actual_cells != p_total_cells THEN
        RAISE EXCEPTION 'Grid count mismatch: requested % but database has % authoritative cells', p_total_cells, v_actual_cells;
    END IF;

    -- 2. Acquire transaction-level advisory lock
    PERFORM pg_advisory_xact_lock(7772271);

    -- 3. Check for any currently active runs
    SELECT count(*) INTO v_active_count 
    FROM public.prediction_runs 
    WHERE status IN ('QUEUED', 'RUNNING');

    IF v_active_count > 0 THEN
        RAISE EXCEPTION 'A full prediction run is already active. Cannot start a new one.';
    END IF;

    -- 4. Atomically create the new run
    INSERT INTO public.prediction_runs (
        model_name, 
        model_version, 
        status, 
        trigger_source, 
        total_cells, 
        processed_cells
    )
    VALUES (
        p_model_name, 
        p_model_version, 
        'QUEUED', 
        'AUTOMATED',
        p_total_cells, 
        0
    )
    RETURNING id INTO v_run_id;

    RETURN v_run_id;
END;
;

-- Explicit Security Grants
REVOKE ALL ON FUNCTION public.start_full_prediction_run(text, text, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.start_full_prediction_run(text, text, integer) TO service_role;
