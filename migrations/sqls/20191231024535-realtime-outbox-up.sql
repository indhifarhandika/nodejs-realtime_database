/* Replace with your SQL commands */
CREATE FUNCTION notify_trigger() RETURNS trigger AS $$
DECLARE
BEGIN
  PERFORM pg_notify('watch_outbox', row_to_json(NEW)::text);
  RETURN new;
END;
$$ LANGUAGE plpgsql;

CREATE FUNCTION notify_trigger_deleted() RETURNS trigger AS $$
DECLARE
BEGIN
  PERFORM pg_notify('del_outbox', row_to_json(OLD)::text);
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;


CREATE FUNCTION notify_trigger_sentitems() RETURNS trigger AS $$
DECLARE
BEGIN
  PERFORM pg_notify('watch_sentitems', row_to_json(NEW)::text);
  RETURN new;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER watch_outbox_trigger AFTER INSERT ON outbox
FOR EACH ROW EXECUTE PROCEDURE notify_trigger();

CREATE TRIGGER watch_outbox_trigger_deleted BEFORE DELETE ON outbox
FOR EACH ROW EXECUTE PROCEDURE notify_trigger_deleted();

CREATE TRIGGER watch_outbox_trigger AFTER INSERT ON sentitems
FOR EACH ROW EXECUTE PROCEDURE notify_trigger_sentitems();