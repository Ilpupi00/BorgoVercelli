--
-- PostgreSQL database dump
--

\restrict XSRn7zahH2wRO10rshv1geTi8YYCyAqcSSIhwG3Fp33xioSbkQI9dwxl6O26vT3

-- Dumped from database version 18.0
-- Dumped by pg_dump version 18.0

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: btree_gist; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS btree_gist WITH SCHEMA public;


--
-- Name: EXTENSION btree_gist; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION btree_gist IS 'support for indexing common datatypes in GiST';


--
-- Name: update_prenotazione_timestamps(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_prenotazione_timestamps() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.inizio_timestamp := (NEW.data_prenotazione::date + NEW.ora_inizio::time);
    NEW.fine_timestamp := (NEW.data_prenotazione::date + NEW.ora_fine::time);
    RETURN NEW;
END;
$$;


--
-- Name: update_push_subscriptions_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_push_subscriptions_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: campi; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.campi (
    id integer NOT NULL,
    nome character varying(255) NOT NULL,
    indirizzo text,
    tipo_superficie character varying(255),
    dimensioni character varying(255),
    illuminazione boolean,
    coperto boolean,
    spogliatoi boolean,
    capienza_pubblico integer,
    attivo boolean,
    descrizione text,
    docce boolean,
    created_at timestamp without time zone,
    updated_at timestamp without time zone
);


--
-- Name: campi_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.campi_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: campi_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.campi_id_seq OWNED BY public.campi.id;


--
-- Name: campionati; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.campionati (
    id integer NOT NULL,
    nome character varying(255) NOT NULL,
    stagione character varying(255) NOT NULL,
    categoria character varying(255),
    fonte_esterna_id character varying(255),
    url_fonte character varying(255),
    attivo boolean,
    promozione_diretta integer DEFAULT 2,
    playoff_start integer,
    playoff_end integer,
    playout_start integer,
    playout_end integer,
    retrocessione_diretta integer DEFAULT 2,
    created_at timestamp without time zone,
    updated_at timestamp without time zone
);


--
-- Name: campionati_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.campionati_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: campionati_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.campionati_id_seq OWNED BY public.campionati.id;


--
-- Name: classifica; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.classifica (
    id integer NOT NULL,
    campionato_id integer,
    squadra_nome character varying(255) NOT NULL,
    nostra_squadra_id integer,
    posizione integer NOT NULL,
    punti integer NOT NULL,
    partite_giocate integer,
    vittorie integer,
    pareggi integer,
    sconfitte integer,
    gol_fatti integer,
    gol_subiti integer,
    differenza_reti integer,
    ultimo_aggiornamento timestamp without time zone,
    created_at timestamp without time zone,
    updated_at timestamp without time zone
);


--
-- Name: classifica_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.classifica_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: classifica_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.classifica_id_seq OWNED BY public.classifica.id;


--
-- Name: dirigenti_squadre; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.dirigenti_squadre (
    id integer NOT NULL,
    utente_id integer NOT NULL,
    squadra_id integer,
    ruolo character varying(255) NOT NULL,
    data_nomina date,
    data_scadenza date,
    attivo boolean DEFAULT true,
    created_at timestamp without time zone,
    updated_at timestamp without time zone
);


--
-- Name: dirigenti_squadre_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.dirigenti_squadre_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: dirigenti_squadre_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.dirigenti_squadre_id_seq OWNED BY public.dirigenti_squadre.id;


--
-- Name: eventi; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.eventi (
    id integer NOT NULL,
    titolo character varying(255) NOT NULL,
    descrizione text,
    data_inizio timestamp without time zone NOT NULL,
    data_fine timestamp without time zone,
    luogo character varying(255),
    tipo_evento character varying(255),
    autore_id integer,
    squadra_id integer,
    campo_id integer,
    max_partecipanti integer,
    pubblicato boolean,
    created_at timestamp without time zone,
    updated_at timestamp without time zone
);


--
-- Name: eventi_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.eventi_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: eventi_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.eventi_id_seq OWNED BY public.eventi.id;


--
-- Name: giocatori; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.giocatori (
    id integer NOT NULL,
    utente_id integer,
    squadra_id integer,
    numero_maglia integer,
    ruolo character varying(255),
    data_nascita date,
    altezza real,
    peso real,
    piede_preferito character varying(255),
    data_inizio_tesseramento date,
    data_fine_tesseramento date,
    attivo boolean,
    created_at timestamp without time zone,
    updated_at timestamp without time zone,
    nome character varying(255),
    cognome character varying(255),
    "nazionalità" character varying(255),
    immagini_id integer
);


--
-- Name: giocatori_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.giocatori_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: giocatori_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.giocatori_id_seq OWNED BY public.giocatori.id;


--
-- Name: immagini; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.immagini (
    id integer NOT NULL,
    titolo character varying(255),
    descrizione text,
    url character varying(255) NOT NULL,
    tipo character varying(255),
    entita_riferimento character varying(255),
    entita_id integer,
    ordine integer,
    created_at timestamp without time zone,
    updated_at timestamp without time zone
);


--
-- Name: immagini_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.immagini_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: immagini_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.immagini_id_seq OWNED BY public.immagini.id;


--
-- Name: notifications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notifications (
    id integer NOT NULL,
    type character varying(50) NOT NULL,
    user_ids integer[],
    payload jsonb NOT NULL,
    status character varying(20) DEFAULT 'pending'::character varying,
    priority integer DEFAULT 0,
    send_after timestamp without time zone DEFAULT now(),
    attempts integer DEFAULT 0,
    max_attempts integer DEFAULT 3,
    last_error text,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    sent_at timestamp without time zone
);


--
-- Name: TABLE notifications; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.notifications IS 'Coda notifiche push da processare in modo asincrono';


--
-- Name: COLUMN notifications.type; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.notifications.type IS 'Tipo di destinatari: admin, user, all';


--
-- Name: COLUMN notifications.user_ids; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.notifications.user_ids IS 'Array di user_id per notifiche a utenti specifici';


--
-- Name: COLUMN notifications.payload; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.notifications.payload IS 'Payload JSON della notifica (title, body, etc)';


--
-- Name: COLUMN notifications.status; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.notifications.status IS 'Stato corrente: pending, sending, sent, failed';


--
-- Name: COLUMN notifications.priority; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.notifications.priority IS 'Priorità: 0=normale, 1=alta, 2=critica';


--
-- Name: COLUMN notifications.send_after; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.notifications.send_after IS 'Timestamp per notifiche programmate';


--
-- Name: COLUMN notifications.attempts; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.notifications.attempts IS 'Numero di tentativi di invio effettuati';


--
-- Name: notifications_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.notifications_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: notifications_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.notifications_id_seq OWNED BY public.notifications.id;


--
-- Name: notizie; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notizie (
    id integer NOT NULL,
    titolo character varying(255) NOT NULL,
    sottotitolo character varying(255),
    contenuto text NOT NULL,
    autore_id integer,
    immagine_principale_id integer,
    pubblicata boolean,
    data_pubblicazione timestamp without time zone,
    visualizzazioni integer,
    created_at timestamp without time zone,
    updated_at timestamp without time zone
);


--
-- Name: notizie_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.notizie_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: notizie_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.notizie_id_seq OWNED BY public.notizie.id;


--
-- Name: orari_campi; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.orari_campi (
    id integer NOT NULL,
    campo_id integer NOT NULL,
    giorno_settimana integer,
    ora_inizio time without time zone NOT NULL,
    ora_fine time without time zone NOT NULL,
    attivo boolean DEFAULT true,
    created_at timestamp without time zone,
    updated_at timestamp without time zone
);


--
-- Name: orari_campi_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.orari_campi_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: orari_campi_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.orari_campi_id_seq OWNED BY public.orari_campi.id;


--
-- Name: partecipazioni_eventi; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.partecipazioni_eventi (
    id integer NOT NULL,
    evento_id integer,
    utente_id integer,
    stato character varying(255),
    note text,
    created_at timestamp without time zone
);


--
-- Name: partecipazioni_eventi_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.partecipazioni_eventi_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: partecipazioni_eventi_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.partecipazioni_eventi_id_seq OWNED BY public.partecipazioni_eventi.id;


--
-- Name: prenotazioni; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.prenotazioni (
    id integer NOT NULL,
    campo_id integer,
    utente_id integer,
    squadra_id integer,
    data_prenotazione date NOT NULL,
    ora_inizio time without time zone NOT NULL,
    ora_fine time without time zone NOT NULL,
    tipo_attivita character varying(255),
    note text,
    stato character varying(255),
    created_at timestamp without time zone,
    updated_at timestamp without time zone,
    annullata_da character varying(10),
    telefono character varying(20),
    codice_fiscale character varying(16),
    tipo_documento character varying(2),
    numero_documento character varying(50)
);


--
-- Name: prenotazioni_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.prenotazioni_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: prenotazioni_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.prenotazioni_id_seq OWNED BY public.prenotazioni.id;


--
-- Name: push_subscriptions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.push_subscriptions (
    id integer NOT NULL,
    user_id integer,
    endpoint text NOT NULL,
    p256dh text NOT NULL,
    auth text NOT NULL,
    is_admin boolean DEFAULT false,
    user_agent text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    last_success_at timestamp without time zone,
    last_error_at timestamp without time zone,
    error_count integer DEFAULT 0
);


--
-- Name: TABLE push_subscriptions; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.push_subscriptions IS 'Memorizza le subscription per le notifiche push web';


--
-- Name: COLUMN push_subscriptions.endpoint; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.push_subscriptions.endpoint IS 'URL endpoint univoco della subscription';


--
-- Name: COLUMN push_subscriptions.p256dh; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.push_subscriptions.p256dh IS 'Chiave pubblica per la crittografia (keys.p256dh)';


--
-- Name: COLUMN push_subscriptions.auth; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.push_subscriptions.auth IS 'Secret di autenticazione per la crittografia (keys.auth)';


--
-- Name: COLUMN push_subscriptions.is_admin; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.push_subscriptions.is_admin IS 'Flag per identificare se l''utente è admin';


--
-- Name: COLUMN push_subscriptions.user_agent; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.push_subscriptions.user_agent IS 'User agent del browser per debug';


--
-- Name: COLUMN push_subscriptions.error_count; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.push_subscriptions.error_count IS 'Contatore di errori consecutivi per pulizia automatica';


--
-- Name: push_subscriptions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.push_subscriptions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: push_subscriptions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.push_subscriptions_id_seq OWNED BY public.push_subscriptions.id;


--
-- Name: recensioni; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.recensioni (
    id integer NOT NULL,
    utente_id integer NOT NULL,
    entita_tipo character varying(255) NOT NULL,
    entita_id integer NOT NULL,
    valutazione integer NOT NULL,
    titolo character varying(255),
    contenuto text,
    data_recensione timestamp without time zone NOT NULL,
    visibile boolean DEFAULT true,
    created_at timestamp without time zone,
    updated_at timestamp without time zone
);


--
-- Name: recensioni_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.recensioni_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: recensioni_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.recensioni_id_seq OWNED BY public.recensioni.id;


--
-- Name: squadre; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.squadre (
    id integer NOT NULL,
    nome character varying(255) NOT NULL,
    categoria character varying(255),
    anno_fondazione integer,
    colori_sociali character varying(255),
    stemma_url character varying(255),
    allenatore_id integer,
    created_at timestamp without time zone,
    updated_at timestamp without time zone
);


--
-- Name: squadre_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.squadre_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: squadre_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.squadre_id_seq OWNED BY public.squadre.id;


--
-- Name: tipi_utente; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tipi_utente (
    id integer NOT NULL,
    nome character varying(255) NOT NULL,
    descrizione text
);


--
-- Name: tipi_utente_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.tipi_utente_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: tipi_utente_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.tipi_utente_id_seq OWNED BY public.tipi_utente.id;


--
-- Name: utenti; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.utenti (
    id integer NOT NULL,
    email character varying(255) NOT NULL,
    password_hash character varying(255),
    nome character varying(255) NOT NULL,
    cognome character varying(255) NOT NULL,
    telefono character varying(255),
    tipo_utente_id integer,
    data_registrazione timestamp without time zone,
    stato character varying(255),
    created_at timestamp without time zone,
    updated_at timestamp without time zone,
    oauth_provider character varying(20) DEFAULT NULL::character varying,
    oauth_id character varying(255) DEFAULT NULL::character varying,
    foto_oauth text
);


--
-- Name: utenti_dati_personali; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.utenti_dati_personali (
    id integer NOT NULL,
    utente_id integer NOT NULL,
    data_nascita date,
    codice_fiscale character varying(16)
);


--
-- Name: utenti_dati_personali_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.utenti_dati_personali_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: utenti_dati_personali_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.utenti_dati_personali_id_seq OWNED BY public.utenti_dati_personali.id;


--
-- Name: utenti_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.utenti_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: utenti_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.utenti_id_seq OWNED BY public.utenti.id;


--
-- Name: utenti_preferenze; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.utenti_preferenze (
    id integer NOT NULL,
    utente_id integer NOT NULL,
    ruolo_preferito character varying(50),
    piede_preferito character varying(50)
);


--
-- Name: utenti_preferenze_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.utenti_preferenze_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: utenti_preferenze_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.utenti_preferenze_id_seq OWNED BY public.utenti_preferenze.id;


--
-- Name: utenti_reset_token; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.utenti_reset_token (
    id integer NOT NULL,
    utente_id integer NOT NULL,
    token character varying(255) NOT NULL,
    expires timestamp without time zone NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: utenti_reset_token_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.utenti_reset_token_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: utenti_reset_token_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.utenti_reset_token_id_seq OWNED BY public.utenti_reset_token.id;


--
-- Name: utenti_sospensioni; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.utenti_sospensioni (
    id integer NOT NULL,
    utente_id integer NOT NULL,
    motivo text,
    data_inizio timestamp without time zone DEFAULT now() NOT NULL,
    data_fine timestamp without time zone,
    admin_id integer,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: utenti_sospensioni_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.utenti_sospensioni_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: utenti_sospensioni_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.utenti_sospensioni_id_seq OWNED BY public.utenti_sospensioni.id;


--
-- Name: campi id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.campi ALTER COLUMN id SET DEFAULT nextval('public.campi_id_seq'::regclass);


--
-- Name: campionati id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.campionati ALTER COLUMN id SET DEFAULT nextval('public.campionati_id_seq'::regclass);


--
-- Name: classifica id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.classifica ALTER COLUMN id SET DEFAULT nextval('public.classifica_id_seq'::regclass);


--
-- Name: dirigenti_squadre id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dirigenti_squadre ALTER COLUMN id SET DEFAULT nextval('public.dirigenti_squadre_id_seq'::regclass);


--
-- Name: eventi id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.eventi ALTER COLUMN id SET DEFAULT nextval('public.eventi_id_seq'::regclass);


--
-- Name: giocatori id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.giocatori ALTER COLUMN id SET DEFAULT nextval('public.giocatori_id_seq'::regclass);


--
-- Name: immagini id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.immagini ALTER COLUMN id SET DEFAULT nextval('public.immagini_id_seq'::regclass);


--
-- Name: notifications id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications ALTER COLUMN id SET DEFAULT nextval('public.notifications_id_seq'::regclass);


--
-- Name: notizie id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notizie ALTER COLUMN id SET DEFAULT nextval('public.notizie_id_seq'::regclass);


--
-- Name: orari_campi id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orari_campi ALTER COLUMN id SET DEFAULT nextval('public.orari_campi_id_seq'::regclass);


--
-- Name: partecipazioni_eventi id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.partecipazioni_eventi ALTER COLUMN id SET DEFAULT nextval('public.partecipazioni_eventi_id_seq'::regclass);


--
-- Name: prenotazioni id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.prenotazioni ALTER COLUMN id SET DEFAULT nextval('public.prenotazioni_id_seq'::regclass);


--
-- Name: push_subscriptions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.push_subscriptions ALTER COLUMN id SET DEFAULT nextval('public.push_subscriptions_id_seq'::regclass);


--
-- Name: recensioni id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recensioni ALTER COLUMN id SET DEFAULT nextval('public.recensioni_id_seq'::regclass);


--
-- Name: squadre id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.squadre ALTER COLUMN id SET DEFAULT nextval('public.squadre_id_seq'::regclass);


--
-- Name: tipi_utente id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tipi_utente ALTER COLUMN id SET DEFAULT nextval('public.tipi_utente_id_seq'::regclass);


--
-- Name: utenti id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.utenti ALTER COLUMN id SET DEFAULT nextval('public.utenti_id_seq'::regclass);


--
-- Name: utenti_dati_personali id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.utenti_dati_personali ALTER COLUMN id SET DEFAULT nextval('public.utenti_dati_personali_id_seq'::regclass);


--
-- Name: utenti_preferenze id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.utenti_preferenze ALTER COLUMN id SET DEFAULT nextval('public.utenti_preferenze_id_seq'::regclass);


--
-- Name: utenti_reset_token id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.utenti_reset_token ALTER COLUMN id SET DEFAULT nextval('public.utenti_reset_token_id_seq'::regclass);


--
-- Name: utenti_sospensioni id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.utenti_sospensioni ALTER COLUMN id SET DEFAULT nextval('public.utenti_sospensioni_id_seq'::regclass);


--
-- Data for Name: campi; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.campi (id, nome, indirizzo, tipo_superficie, dimensioni, illuminazione, coperto, spogliatoi, capienza_pubblico, attivo, descrizione, docce, created_at, updated_at) FROM stdin;
1	prova	prova			t	t	t	12	f	12	t	2026-02-27 10:15:45.84848	2026-04-13 20:57:31.938673
\.


--
-- Data for Name: campionati; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.campionati (id, nome, stagione, categoria, fonte_esterna_id, url_fonte, attivo, promozione_diretta, playoff_start, playoff_end, playout_start, playout_end, retrocessione_diretta, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: classifica; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.classifica (id, campionato_id, squadra_nome, nostra_squadra_id, posizione, punti, partite_giocate, vittorie, pareggi, sconfitte, gol_fatti, gol_subiti, differenza_reti, ultimo_aggiornamento, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: dirigenti_squadre; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.dirigenti_squadre (id, utente_id, squadra_id, ruolo, data_nomina, data_scadenza, attivo, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: eventi; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.eventi (id, titolo, descrizione, data_inizio, data_fine, luogo, tipo_evento, autore_id, squadra_id, campo_id, max_partecipanti, pubblicato, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: giocatori; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.giocatori (id, utente_id, squadra_id, numero_maglia, ruolo, data_nascita, altezza, peso, piede_preferito, data_inizio_tesseramento, data_fine_tesseramento, attivo, created_at, updated_at, nome, cognome, "nazionalità", immagini_id) FROM stdin;
\.


--
-- Data for Name: immagini; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.immagini (id, titolo, descrizione, url, tipo, entita_riferimento, entita_id, ordine, created_at, updated_at) FROM stdin;
5	\N	Foto profilo utente	https://lh3.googleusercontent.com/a/ACg8ocKhj1yWMwg9STAzUvzhsY-doKAyia-_f-FFKJza0Z5oP0iGrHWc=s96-c	profilo	utente	1	1	2026-03-02 00:27:58.443	2026-03-02 00:27:58.443
\.


--
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.notifications (id, type, user_ids, payload, status, priority, send_after, attempts, max_attempts, last_error, created_at, updated_at, sent_at) FROM stdin;
\.


--
-- Data for Name: notizie; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.notizie (id, titolo, sottotitolo, contenuto, autore_id, immagine_principale_id, pubblicata, data_pubblicazione, visualizzazioni, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: orari_campi; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.orari_campi (id, campo_id, giorno_settimana, ora_inizio, ora_fine, attivo, created_at, updated_at) FROM stdin;
1	1	\N	16:00:00	17:00:00	t	2026-02-27 10:15:45.850471	2026-02-27 10:15:45.850471
2	1	\N	18:00:00	19:00:00	t	2026-02-27 10:15:45.852428	2026-02-27 10:15:45.852428
3	1	\N	20:00:00	21:00:00	t	2026-02-27 10:15:45.852861	2026-02-27 10:15:45.852861
4	1	\N	21:00:00	22:00:00	t	2026-02-27 10:15:45.853244	2026-02-27 10:15:45.853244
\.


--
-- Data for Name: partecipazioni_eventi; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.partecipazioni_eventi (id, evento_id, utente_id, stato, note, created_at) FROM stdin;
\.


--
-- Data for Name: prenotazioni; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.prenotazioni (id, campo_id, utente_id, squadra_id, data_prenotazione, ora_inizio, ora_fine, tipo_attivita, note, stato, created_at, updated_at, annullata_da, telefono, codice_fiscale, tipo_documento, numero_documento) FROM stdin;
435	1	2	\N	2026-04-14	15:00:00	10:00:00	Calcio	Prenotazione di test #33	confermata	2026-03-12 11:03:03.66755	2026-03-12 11:03:03.66755	\N	3330000000	RSSMRA80A01H501W	CI	DOC33
436	1	2	\N	2026-04-15	10:00:00	16:00:00	Calcio	Prenotazione di test #34	confermata	2026-03-12 11:03:03.66755	2026-03-12 11:03:03.66755	\N	3330000000	RSSMRA80A01H501W	CI	DOC34
437	1	2	\N	2026-04-16	13:00:00	13:00:00	Calcio	Prenotazione di test #35	confermata	2026-03-12 11:03:03.66755	2026-03-12 11:03:03.66755	\N	3330000000	RSSMRA80A01H501W	CI	DOC35
438	1	2	\N	2026-04-17	14:00:00	19:00:00	Calcio	Prenotazione di test #36	confermata	2026-03-12 11:03:03.66755	2026-03-12 11:03:03.66755	\N	3330000000	RSSMRA80A01H501W	CI	DOC36
439	1	2	\N	2026-04-18	10:00:00	11:00:00	Calcio	Prenotazione di test #37	confermata	2026-03-12 11:03:03.66755	2026-03-12 11:03:03.66755	\N	3330000000	RSSMRA80A01H501W	CI	DOC37
440	1	2	\N	2026-04-19	17:00:00	11:00:00	Calcio	Prenotazione di test #38	confermata	2026-03-12 11:03:03.66755	2026-03-12 11:03:03.66755	\N	3330000000	RSSMRA80A01H501W	CI	DOC38
441	1	2	\N	2026-04-20	15:00:00	17:00:00	Calcio	Prenotazione di test #39	confermata	2026-03-12 11:03:03.66755	2026-03-12 11:03:03.66755	\N	3330000000	RSSMRA80A01H501W	CI	DOC39
442	1	2	\N	2026-04-21	13:00:00	16:00:00	Calcio	Prenotazione di test #40	confermata	2026-03-12 11:03:03.66755	2026-03-12 11:03:03.66755	\N	3330000000	RSSMRA80A01H501W	CI	DOC40
443	1	2	\N	2026-04-22	13:00:00	19:00:00	Calcio	Prenotazione di test #41	confermata	2026-03-12 11:03:03.66755	2026-03-12 11:03:03.66755	\N	3330000000	RSSMRA80A01H501W	CI	DOC41
444	1	2	\N	2026-04-23	13:00:00	15:00:00	Calcio	Prenotazione di test #42	confermata	2026-03-12 11:03:03.66755	2026-03-12 11:03:03.66755	\N	3330000000	RSSMRA80A01H501W	CI	DOC42
445	1	2	\N	2026-04-24	12:00:00	15:00:00	Calcio	Prenotazione di test #43	confermata	2026-03-12 11:03:03.66755	2026-03-12 11:03:03.66755	\N	3330000000	RSSMRA80A01H501W	CI	DOC43
446	1	2	\N	2026-04-25	14:00:00	17:00:00	Calcio	Prenotazione di test #44	confermata	2026-03-12 11:03:03.66755	2026-03-12 11:03:03.66755	\N	3330000000	RSSMRA80A01H501W	CI	DOC44
447	1	2	\N	2026-04-26	17:00:00	13:00:00	Calcio	Prenotazione di test #45	confermata	2026-03-12 11:03:03.66755	2026-03-12 11:03:03.66755	\N	3330000000	RSSMRA80A01H501W	CI	DOC45
448	1	2	\N	2026-04-27	08:00:00	13:00:00	Calcio	Prenotazione di test #46	confermata	2026-03-12 11:03:03.66755	2026-03-12 11:03:03.66755	\N	3330000000	RSSMRA80A01H501W	CI	DOC46
426	1	2	\N	2026-04-05	08:00:00	11:00:00	Calcio	Prenotazione di test #24	scaduta	2026-03-12 11:03:03.66755	2026-04-05 11:10:56.291029	\N	3330000000	RSSMRA80A01H501W	CI	DOC24
427	1	2	\N	2026-04-06	08:00:00	18:00:00	Calcio	Prenotazione di test #25	scaduta	2026-03-12 11:03:03.66755	2026-04-12 09:47:07.397291	\N	3330000000	RSSMRA80A01H501W	CI	DOC25
428	1	2	\N	2026-04-07	09:00:00	17:00:00	Calcio	Prenotazione di test #26	scaduta	2026-03-12 11:03:03.66755	2026-04-12 09:47:07.397291	\N	3330000000	RSSMRA80A01H501W	CI	DOC26
429	1	2	\N	2026-04-08	14:00:00	19:00:00	Calcio	Prenotazione di test #27	scaduta	2026-03-12 11:03:03.66755	2026-04-12 09:47:07.397291	\N	3330000000	RSSMRA80A01H501W	CI	DOC27
430	1	2	\N	2026-04-09	11:00:00	13:00:00	Calcio	Prenotazione di test #28	scaduta	2026-03-12 11:03:03.66755	2026-04-12 09:47:07.397291	\N	3330000000	RSSMRA80A01H501W	CI	DOC28
431	1	2	\N	2026-04-10	16:00:00	11:00:00	Calcio	Prenotazione di test #29	scaduta	2026-03-12 11:03:03.66755	2026-04-12 09:47:07.397291	\N	3330000000	RSSMRA80A01H501W	CI	DOC29
432	1	2	\N	2026-04-11	13:00:00	11:00:00	Calcio	Prenotazione di test #30	scaduta	2026-03-12 11:03:03.66755	2026-04-12 09:47:07.397291	\N	3330000000	RSSMRA80A01H501W	CI	DOC30
433	1	2	\N	2026-04-12	15:00:00	15:00:00	Calcio	Prenotazione di test #31	scaduta	2026-03-12 11:03:03.66755	2026-04-13 15:14:50.282661	\N	3330000000	RSSMRA80A01H501W	CI	DOC31
434	1	2	\N	2026-04-13	16:00:00	13:00:00	Calcio	Prenotazione di test #32	scaduta	2026-03-12 11:03:03.66755	2026-04-13 15:14:50.282661	\N	3330000000	RSSMRA80A01H501W	CI	DOC32
449	1	2	\N	2026-04-28	15:00:00	12:00:00	Calcio	Prenotazione di test #47	confermata	2026-03-12 11:03:03.66755	2026-03-12 11:03:03.66755	\N	3330000000	RSSMRA80A01H501W	CI	DOC47
450	1	2	\N	2026-04-29	10:00:00	14:00:00	Calcio	Prenotazione di test #48	confermata	2026-03-12 11:03:03.66755	2026-03-12 11:03:03.66755	\N	3330000000	RSSMRA80A01H501W	CI	DOC48
451	1	2	\N	2026-04-30	09:00:00	17:00:00	Calcio	Prenotazione di test #49	confermata	2026-03-12 11:03:03.66755	2026-03-12 11:03:03.66755	\N	3330000000	RSSMRA80A01H501W	CI	DOC49
452	1	2	\N	2026-05-01	15:00:00	17:00:00	Calcio	Prenotazione di test #50	confermata	2026-03-12 11:03:03.66755	2026-03-12 11:03:03.66755	\N	3330000000	RSSMRA80A01H501W	CI	DOC50
453	1	2	\N	2026-05-02	14:00:00	18:00:00	Calcio	Prenotazione di test #51	confermata	2026-03-12 11:03:03.66755	2026-03-12 11:03:03.66755	\N	3330000000	RSSMRA80A01H501W	CI	DOC51
454	1	2	\N	2026-05-03	14:00:00	17:00:00	Calcio	Prenotazione di test #52	confermata	2026-03-12 11:03:03.66755	2026-03-12 11:03:03.66755	\N	3330000000	RSSMRA80A01H501W	CI	DOC52
455	1	2	\N	2026-05-04	10:00:00	15:00:00	Calcio	Prenotazione di test #53	confermata	2026-03-12 11:03:03.66755	2026-03-12 11:03:03.66755	\N	3330000000	RSSMRA80A01H501W	CI	DOC53
456	1	2	\N	2026-05-05	09:00:00	14:00:00	Calcio	Prenotazione di test #54	confermata	2026-03-12 11:03:03.66755	2026-03-12 11:03:03.66755	\N	3330000000	RSSMRA80A01H501W	CI	DOC54
457	1	2	\N	2026-05-06	08:00:00	11:00:00	Calcio	Prenotazione di test #55	confermata	2026-03-12 11:03:03.66755	2026-03-12 11:03:03.66755	\N	3330000000	RSSMRA80A01H501W	CI	DOC55
458	1	2	\N	2026-05-07	10:00:00	18:00:00	Calcio	Prenotazione di test #56	confermata	2026-03-12 11:03:03.66755	2026-03-12 11:03:03.66755	\N	3330000000	RSSMRA80A01H501W	CI	DOC56
459	1	2	\N	2026-05-08	09:00:00	17:00:00	Calcio	Prenotazione di test #57	confermata	2026-03-12 11:03:03.66755	2026-03-12 11:03:03.66755	\N	3330000000	RSSMRA80A01H501W	CI	DOC57
460	1	2	\N	2026-05-09	13:00:00	10:00:00	Calcio	Prenotazione di test #58	confermata	2026-03-12 11:03:03.66755	2026-03-12 11:03:03.66755	\N	3330000000	RSSMRA80A01H501W	CI	DOC58
461	1	2	\N	2026-05-10	16:00:00	11:00:00	Calcio	Prenotazione di test #59	confermata	2026-03-12 11:03:03.66755	2026-03-12 11:03:03.66755	\N	3330000000	RSSMRA80A01H501W	CI	DOC59
462	1	2	\N	2026-05-11	16:00:00	14:00:00	Calcio	Prenotazione di test #60	confermata	2026-03-12 11:03:03.66755	2026-03-12 11:03:03.66755	\N	3330000000	RSSMRA80A01H501W	CI	DOC60
463	1	2	\N	2026-05-12	08:00:00	19:00:00	Calcio	Prenotazione di test #61	confermata	2026-03-12 11:03:03.66755	2026-03-12 11:03:03.66755	\N	3330000000	RSSMRA80A01H501W	CI	DOC61
464	1	2	\N	2026-05-13	16:00:00	11:00:00	Calcio	Prenotazione di test #62	confermata	2026-03-12 11:03:03.66755	2026-03-12 11:03:03.66755	\N	3330000000	RSSMRA80A01H501W	CI	DOC62
465	1	2	\N	2026-05-14	13:00:00	13:00:00	Calcio	Prenotazione di test #63	confermata	2026-03-12 11:03:03.66755	2026-03-12 11:03:03.66755	\N	3330000000	RSSMRA80A01H501W	CI	DOC63
466	1	2	\N	2026-05-15	17:00:00	10:00:00	Calcio	Prenotazione di test #64	confermata	2026-03-12 11:03:03.66755	2026-03-12 11:03:03.66755	\N	3330000000	RSSMRA80A01H501W	CI	DOC64
467	1	2	\N	2026-05-16	10:00:00	17:00:00	Calcio	Prenotazione di test #65	confermata	2026-03-12 11:03:03.66755	2026-03-12 11:03:03.66755	\N	3330000000	RSSMRA80A01H501W	CI	DOC65
468	1	2	\N	2026-05-17	09:00:00	19:00:00	Calcio	Prenotazione di test #66	confermata	2026-03-12 11:03:03.66755	2026-03-12 11:03:03.66755	\N	3330000000	RSSMRA80A01H501W	CI	DOC66
469	1	2	\N	2026-05-18	15:00:00	16:00:00	Calcio	Prenotazione di test #67	confermata	2026-03-12 11:03:03.66755	2026-03-12 11:03:03.66755	\N	3330000000	RSSMRA80A01H501W	CI	DOC67
470	1	2	\N	2026-05-19	17:00:00	16:00:00	Calcio	Prenotazione di test #68	confermata	2026-03-12 11:03:03.66755	2026-03-12 11:03:03.66755	\N	3330000000	RSSMRA80A01H501W	CI	DOC68
471	1	2	\N	2026-05-20	13:00:00	12:00:00	Calcio	Prenotazione di test #69	confermata	2026-03-12 11:03:03.66755	2026-03-12 11:03:03.66755	\N	3330000000	RSSMRA80A01H501W	CI	DOC69
472	1	2	\N	2026-05-21	10:00:00	17:00:00	Calcio	Prenotazione di test #70	confermata	2026-03-12 11:03:03.66755	2026-03-12 11:03:03.66755	\N	3330000000	RSSMRA80A01H501W	CI	DOC70
473	1	2	\N	2026-05-22	12:00:00	12:00:00	Calcio	Prenotazione di test #71	confermata	2026-03-12 11:03:03.66755	2026-03-12 11:03:03.66755	\N	3330000000	RSSMRA80A01H501W	CI	DOC71
474	1	2	\N	2026-05-23	15:00:00	14:00:00	Calcio	Prenotazione di test #72	confermata	2026-03-12 11:03:03.66755	2026-03-12 11:03:03.66755	\N	3330000000	RSSMRA80A01H501W	CI	DOC72
475	1	2	\N	2026-05-24	09:00:00	10:00:00	Calcio	Prenotazione di test #73	confermata	2026-03-12 11:03:03.66755	2026-03-12 11:03:03.66755	\N	3330000000	RSSMRA80A01H501W	CI	DOC73
476	1	2	\N	2026-05-25	10:00:00	15:00:00	Calcio	Prenotazione di test #74	confermata	2026-03-12 11:03:03.66755	2026-03-12 11:03:03.66755	\N	3330000000	RSSMRA80A01H501W	CI	DOC74
477	1	2	\N	2026-05-26	16:00:00	11:00:00	Calcio	Prenotazione di test #75	confermata	2026-03-12 11:03:03.66755	2026-03-12 11:03:03.66755	\N	3330000000	RSSMRA80A01H501W	CI	DOC75
478	1	2	\N	2026-05-27	14:00:00	12:00:00	Calcio	Prenotazione di test #76	confermata	2026-03-12 11:03:03.66755	2026-03-12 11:03:03.66755	\N	3330000000	RSSMRA80A01H501W	CI	DOC76
479	1	2	\N	2026-05-28	14:00:00	11:00:00	Calcio	Prenotazione di test #77	confermata	2026-03-12 11:03:03.66755	2026-03-12 11:03:03.66755	\N	3330000000	RSSMRA80A01H501W	CI	DOC77
480	1	2	\N	2026-05-29	14:00:00	16:00:00	Calcio	Prenotazione di test #78	confermata	2026-03-12 11:03:03.66755	2026-03-12 11:03:03.66755	\N	3330000000	RSSMRA80A01H501W	CI	DOC78
481	1	2	\N	2026-05-30	13:00:00	15:00:00	Calcio	Prenotazione di test #79	confermata	2026-03-12 11:03:03.66755	2026-03-12 11:03:03.66755	\N	3330000000	RSSMRA80A01H501W	CI	DOC79
482	1	2	\N	2026-05-31	10:00:00	16:00:00	Calcio	Prenotazione di test #80	confermata	2026-03-12 11:03:03.66755	2026-03-12 11:03:03.66755	\N	3330000000	RSSMRA80A01H501W	CI	DOC80
483	1	2	\N	2026-06-01	12:00:00	13:00:00	Calcio	Prenotazione di test #81	confermata	2026-03-12 11:03:03.66755	2026-03-12 11:03:03.66755	\N	3330000000	RSSMRA80A01H501W	CI	DOC81
484	1	2	\N	2026-06-02	12:00:00	14:00:00	Calcio	Prenotazione di test #82	confermata	2026-03-12 11:03:03.66755	2026-03-12 11:03:03.66755	\N	3330000000	RSSMRA80A01H501W	CI	DOC82
485	1	2	\N	2026-06-03	17:00:00	16:00:00	Calcio	Prenotazione di test #83	confermata	2026-03-12 11:03:03.66755	2026-03-12 11:03:03.66755	\N	3330000000	RSSMRA80A01H501W	CI	DOC83
486	1	2	\N	2026-06-04	16:00:00	15:00:00	Calcio	Prenotazione di test #84	confermata	2026-03-12 11:03:03.66755	2026-03-12 11:03:03.66755	\N	3330000000	RSSMRA80A01H501W	CI	DOC84
487	1	2	\N	2026-06-05	09:00:00	18:00:00	Calcio	Prenotazione di test #85	confermata	2026-03-12 11:03:03.66755	2026-03-12 11:03:03.66755	\N	3330000000	RSSMRA80A01H501W	CI	DOC85
488	1	2	\N	2026-06-06	08:00:00	12:00:00	Calcio	Prenotazione di test #86	confermata	2026-03-12 11:03:03.66755	2026-03-12 11:03:03.66755	\N	3330000000	RSSMRA80A01H501W	CI	DOC86
489	1	2	\N	2026-06-07	08:00:00	14:00:00	Calcio	Prenotazione di test #87	confermata	2026-03-12 11:03:03.66755	2026-03-12 11:03:03.66755	\N	3330000000	RSSMRA80A01H501W	CI	DOC87
490	1	2	\N	2026-06-08	13:00:00	18:00:00	Calcio	Prenotazione di test #88	confermata	2026-03-12 11:03:03.66755	2026-03-12 11:03:03.66755	\N	3330000000	RSSMRA80A01H501W	CI	DOC88
491	1	2	\N	2026-06-09	08:00:00	19:00:00	Calcio	Prenotazione di test #89	confermata	2026-03-12 11:03:03.66755	2026-03-12 11:03:03.66755	\N	3330000000	RSSMRA80A01H501W	CI	DOC89
492	1	2	\N	2026-06-10	08:00:00	11:00:00	Calcio	Prenotazione di test #90	confermata	2026-03-12 11:03:03.66755	2026-03-12 11:03:03.66755	\N	3330000000	RSSMRA80A01H501W	CI	DOC90
493	1	2	\N	2026-06-11	09:00:00	15:00:00	Calcio	Prenotazione di test #91	confermata	2026-03-12 11:03:03.66755	2026-03-12 11:03:03.66755	\N	3330000000	RSSMRA80A01H501W	CI	DOC91
494	1	2	\N	2026-06-12	13:00:00	16:00:00	Calcio	Prenotazione di test #92	confermata	2026-03-12 11:03:03.66755	2026-03-12 11:03:03.66755	\N	3330000000	RSSMRA80A01H501W	CI	DOC92
495	1	2	\N	2026-06-13	11:00:00	17:00:00	Calcio	Prenotazione di test #93	confermata	2026-03-12 11:03:03.66755	2026-03-12 11:03:03.66755	\N	3330000000	RSSMRA80A01H501W	CI	DOC93
496	1	2	\N	2026-06-14	09:00:00	18:00:00	Calcio	Prenotazione di test #94	confermata	2026-03-12 11:03:03.66755	2026-03-12 11:03:03.66755	\N	3330000000	RSSMRA80A01H501W	CI	DOC94
497	1	2	\N	2026-06-15	09:00:00	17:00:00	Calcio	Prenotazione di test #95	confermata	2026-03-12 11:03:03.66755	2026-03-12 11:03:03.66755	\N	3330000000	RSSMRA80A01H501W	CI	DOC95
498	1	2	\N	2026-06-16	17:00:00	14:00:00	Calcio	Prenotazione di test #96	confermata	2026-03-12 11:03:03.66755	2026-03-12 11:03:03.66755	\N	3330000000	RSSMRA80A01H501W	CI	DOC96
499	1	2	\N	2026-06-17	12:00:00	16:00:00	Calcio	Prenotazione di test #97	confermata	2026-03-12 11:03:03.66755	2026-03-12 11:03:03.66755	\N	3330000000	RSSMRA80A01H501W	CI	DOC97
500	1	2	\N	2026-06-18	16:00:00	18:00:00	Calcio	Prenotazione di test #98	confermata	2026-03-12 11:03:03.66755	2026-03-12 11:03:03.66755	\N	3330000000	RSSMRA80A01H501W	CI	DOC98
501	1	2	\N	2026-06-19	11:00:00	14:00:00	Calcio	Prenotazione di test #99	confermata	2026-03-12 11:03:03.66755	2026-03-12 11:03:03.66755	\N	3330000000	RSSMRA80A01H501W	CI	DOC99
502	1	2	\N	2026-06-20	17:00:00	19:00:00	Calcio	Prenotazione di test #100	confermata	2026-03-12 11:03:03.66755	2026-03-12 11:03:03.66755	\N	3330000000	RSSMRA80A01H501W	CI	DOC100
503	1	2	\N	2026-06-21	14:00:00	12:00:00	Calcio	Prenotazione di test #101	confermata	2026-03-12 11:03:03.66755	2026-03-12 11:03:03.66755	\N	3330000000	RSSMRA80A01H501W	CI	DOC101
504	1	2	\N	2026-06-22	11:00:00	10:00:00	Calcio	Prenotazione di test #102	confermata	2026-03-12 11:03:03.66755	2026-03-12 11:03:03.66755	\N	3330000000	RSSMRA80A01H501W	CI	DOC102
505	1	2	\N	2026-06-23	13:00:00	18:00:00	Calcio	Prenotazione di test #103	confermata	2026-03-12 11:03:03.66755	2026-03-12 11:03:03.66755	\N	3330000000	RSSMRA80A01H501W	CI	DOC103
506	1	2	\N	2026-06-24	13:00:00	19:00:00	Calcio	Prenotazione di test #104	confermata	2026-03-12 11:03:03.66755	2026-03-12 11:03:03.66755	\N	3330000000	RSSMRA80A01H501W	CI	DOC104
507	1	2	\N	2026-06-25	09:00:00	15:00:00	Calcio	Prenotazione di test #105	confermata	2026-03-12 11:03:03.66755	2026-03-12 11:03:03.66755	\N	3330000000	RSSMRA80A01H501W	CI	DOC105
508	1	2	\N	2026-06-26	15:00:00	11:00:00	Calcio	Prenotazione di test #106	confermata	2026-03-12 11:03:03.66755	2026-03-12 11:03:03.66755	\N	3330000000	RSSMRA80A01H501W	CI	DOC106
509	1	2	\N	2026-06-27	10:00:00	17:00:00	Calcio	Prenotazione di test #107	confermata	2026-03-12 11:03:03.66755	2026-03-12 11:03:03.66755	\N	3330000000	RSSMRA80A01H501W	CI	DOC107
510	1	2	\N	2026-06-28	17:00:00	19:00:00	Calcio	Prenotazione di test #108	confermata	2026-03-12 11:03:03.66755	2026-03-12 11:03:03.66755	\N	3330000000	RSSMRA80A01H501W	CI	DOC108
511	1	2	\N	2026-06-29	16:00:00	13:00:00	Calcio	Prenotazione di test #109	confermata	2026-03-12 11:03:03.66755	2026-03-12 11:03:03.66755	\N	3330000000	RSSMRA80A01H501W	CI	DOC109
512	1	2	\N	2026-06-30	12:00:00	19:00:00	Calcio	Prenotazione di test #110	confermata	2026-03-12 11:03:03.66755	2026-03-12 11:03:03.66755	\N	3330000000	RSSMRA80A01H501W	CI	DOC110
513	1	2	\N	2026-07-01	10:00:00	16:00:00	Calcio	Prenotazione di test #111	confermata	2026-03-12 11:03:03.66755	2026-03-12 11:03:03.66755	\N	3330000000	RSSMRA80A01H501W	CI	DOC111
514	1	2	\N	2026-07-02	08:00:00	11:00:00	Calcio	Prenotazione di test #112	confermata	2026-03-12 11:03:03.66755	2026-03-12 11:03:03.66755	\N	3330000000	RSSMRA80A01H501W	CI	DOC112
515	1	2	\N	2026-07-03	11:00:00	10:00:00	Calcio	Prenotazione di test #113	confermata	2026-03-12 11:03:03.66755	2026-03-12 11:03:03.66755	\N	3330000000	RSSMRA80A01H501W	CI	DOC113
516	1	2	\N	2026-07-04	11:00:00	15:00:00	Calcio	Prenotazione di test #114	confermata	2026-03-12 11:03:03.66755	2026-03-12 11:03:03.66755	\N	3330000000	RSSMRA80A01H501W	CI	DOC114
517	1	2	\N	2026-07-05	12:00:00	13:00:00	Calcio	Prenotazione di test #115	confermata	2026-03-12 11:03:03.66755	2026-03-12 11:03:03.66755	\N	3330000000	RSSMRA80A01H501W	CI	DOC115
518	1	2	\N	2026-07-06	14:00:00	10:00:00	Calcio	Prenotazione di test #116	confermata	2026-03-12 11:03:03.66755	2026-03-12 11:03:03.66755	\N	3330000000	RSSMRA80A01H501W	CI	DOC116
519	1	2	\N	2026-07-07	10:00:00	17:00:00	Calcio	Prenotazione di test #117	confermata	2026-03-12 11:03:03.66755	2026-03-12 11:03:03.66755	\N	3330000000	RSSMRA80A01H501W	CI	DOC117
520	1	2	\N	2026-07-08	08:00:00	12:00:00	Calcio	Prenotazione di test #118	confermata	2026-03-12 11:03:03.66755	2026-03-12 11:03:03.66755	\N	3330000000	RSSMRA80A01H501W	CI	DOC118
521	1	2	\N	2026-07-09	17:00:00	15:00:00	Calcio	Prenotazione di test #119	confermata	2026-03-12 11:03:03.66755	2026-03-12 11:03:03.66755	\N	3330000000	RSSMRA80A01H501W	CI	DOC119
522	1	2	\N	2026-07-10	10:00:00	10:00:00	Calcio	Prenotazione di test #120	confermata	2026-03-12 11:03:03.66755	2026-03-12 11:03:03.66755	\N	3330000000	RSSMRA80A01H501W	CI	DOC120
523	1	2	\N	2026-07-11	10:00:00	19:00:00	Calcio	Prenotazione di test #121	confermata	2026-03-12 11:03:03.66755	2026-03-12 11:03:03.66755	\N	3330000000	RSSMRA80A01H501W	CI	DOC121
524	1	2	\N	2026-07-12	09:00:00	13:00:00	Calcio	Prenotazione di test #122	confermata	2026-03-12 11:03:03.66755	2026-03-12 11:03:03.66755	\N	3330000000	RSSMRA80A01H501W	CI	DOC122
525	1	2	\N	2026-07-13	09:00:00	10:00:00	Calcio	Prenotazione di test #123	confermata	2026-03-12 11:03:03.66755	2026-03-12 11:03:03.66755	\N	3330000000	RSSMRA80A01H501W	CI	DOC123
526	1	2	\N	2026-07-14	13:00:00	10:00:00	Calcio	Prenotazione di test #124	confermata	2026-03-12 11:03:03.66755	2026-03-12 11:03:03.66755	\N	3330000000	RSSMRA80A01H501W	CI	DOC124
527	1	2	\N	2026-07-15	16:00:00	16:00:00	Calcio	Prenotazione di test #125	confermata	2026-03-12 11:03:03.66755	2026-03-12 11:03:03.66755	\N	3330000000	RSSMRA80A01H501W	CI	DOC125
528	1	2	\N	2026-07-16	16:00:00	19:00:00	Calcio	Prenotazione di test #126	confermata	2026-03-12 11:03:03.66755	2026-03-12 11:03:03.66755	\N	3330000000	RSSMRA80A01H501W	CI	DOC126
529	1	2	\N	2026-07-17	15:00:00	15:00:00	Calcio	Prenotazione di test #127	confermata	2026-03-12 11:03:03.66755	2026-03-12 11:03:03.66755	\N	3330000000	RSSMRA80A01H501W	CI	DOC127
530	1	2	\N	2026-07-18	11:00:00	15:00:00	Calcio	Prenotazione di test #128	confermata	2026-03-12 11:03:03.66755	2026-03-12 11:03:03.66755	\N	3330000000	RSSMRA80A01H501W	CI	DOC128
531	1	2	\N	2026-07-19	09:00:00	18:00:00	Calcio	Prenotazione di test #129	confermata	2026-03-12 11:03:03.66755	2026-03-12 11:03:03.66755	\N	3330000000	RSSMRA80A01H501W	CI	DOC129
532	1	2	\N	2026-07-20	13:00:00	11:00:00	Calcio	Prenotazione di test #130	confermata	2026-03-12 11:03:03.66755	2026-03-12 11:03:03.66755	\N	3330000000	RSSMRA80A01H501W	CI	DOC130
533	1	2	\N	2026-07-21	12:00:00	17:00:00	Calcio	Prenotazione di test #131	confermata	2026-03-12 11:03:03.66755	2026-03-12 11:03:03.66755	\N	3330000000	RSSMRA80A01H501W	CI	DOC131
534	1	2	\N	2026-07-22	09:00:00	16:00:00	Calcio	Prenotazione di test #132	confermata	2026-03-12 11:03:03.66755	2026-03-12 11:03:03.66755	\N	3330000000	RSSMRA80A01H501W	CI	DOC132
535	1	2	\N	2026-07-23	15:00:00	13:00:00	Calcio	Prenotazione di test #133	confermata	2026-03-12 11:03:03.66755	2026-03-12 11:03:03.66755	\N	3330000000	RSSMRA80A01H501W	CI	DOC133
536	1	2	\N	2026-07-24	15:00:00	15:00:00	Calcio	Prenotazione di test #134	confermata	2026-03-12 11:03:03.66755	2026-03-12 11:03:03.66755	\N	3330000000	RSSMRA80A01H501W	CI	DOC134
537	1	2	\N	2026-07-25	08:00:00	15:00:00	Calcio	Prenotazione di test #135	confermata	2026-03-12 11:03:03.66755	2026-03-12 11:03:03.66755	\N	3330000000	RSSMRA80A01H501W	CI	DOC135
538	1	2	\N	2026-07-26	09:00:00	19:00:00	Calcio	Prenotazione di test #136	confermata	2026-03-12 11:03:03.66755	2026-03-12 11:03:03.66755	\N	3330000000	RSSMRA80A01H501W	CI	DOC136
539	1	2	\N	2026-07-27	08:00:00	13:00:00	Calcio	Prenotazione di test #137	confermata	2026-03-12 11:03:03.66755	2026-03-12 11:03:03.66755	\N	3330000000	RSSMRA80A01H501W	CI	DOC137
540	1	2	\N	2026-07-28	11:00:00	15:00:00	Calcio	Prenotazione di test #138	confermata	2026-03-12 11:03:03.66755	2026-03-12 11:03:03.66755	\N	3330000000	RSSMRA80A01H501W	CI	DOC138
541	1	2	\N	2026-07-29	11:00:00	14:00:00	Calcio	Prenotazione di test #139	confermata	2026-03-12 11:03:03.66755	2026-03-12 11:03:03.66755	\N	3330000000	RSSMRA80A01H501W	CI	DOC139
542	1	2	\N	2026-07-30	09:00:00	19:00:00	Calcio	Prenotazione di test #140	confermata	2026-03-12 11:03:03.66755	2026-03-12 11:03:03.66755	\N	3330000000	RSSMRA80A01H501W	CI	DOC140
543	1	2	\N	2026-07-31	11:00:00	14:00:00	Calcio	Prenotazione di test #141	confermata	2026-03-12 11:03:03.66755	2026-03-12 11:03:03.66755	\N	3330000000	RSSMRA80A01H501W	CI	DOC141
544	1	2	\N	2026-08-01	12:00:00	14:00:00	Calcio	Prenotazione di test #142	confermata	2026-03-12 11:03:03.66755	2026-03-12 11:03:03.66755	\N	3330000000	RSSMRA80A01H501W	CI	DOC142
545	1	2	\N	2026-08-02	15:00:00	17:00:00	Calcio	Prenotazione di test #143	confermata	2026-03-12 11:03:03.66755	2026-03-12 11:03:03.66755	\N	3330000000	RSSMRA80A01H501W	CI	DOC143
546	1	2	\N	2026-08-03	10:00:00	15:00:00	Calcio	Prenotazione di test #144	confermata	2026-03-12 11:03:03.66755	2026-03-12 11:03:03.66755	\N	3330000000	RSSMRA80A01H501W	CI	DOC144
547	1	2	\N	2026-08-04	10:00:00	13:00:00	Calcio	Prenotazione di test #145	confermata	2026-03-12 11:03:03.66755	2026-03-12 11:03:03.66755	\N	3330000000	RSSMRA80A01H501W	CI	DOC145
548	1	2	\N	2026-08-05	17:00:00	16:00:00	Calcio	Prenotazione di test #146	confermata	2026-03-12 11:03:03.66755	2026-03-12 11:03:03.66755	\N	3330000000	RSSMRA80A01H501W	CI	DOC146
549	1	2	\N	2026-08-06	09:00:00	14:00:00	Calcio	Prenotazione di test #147	confermata	2026-03-12 11:03:03.66755	2026-03-12 11:03:03.66755	\N	3330000000	RSSMRA80A01H501W	CI	DOC147
550	1	2	\N	2026-08-07	11:00:00	18:00:00	Calcio	Prenotazione di test #148	confermata	2026-03-12 11:03:03.66755	2026-03-12 11:03:03.66755	\N	3330000000	RSSMRA80A01H501W	CI	DOC148
551	1	2	\N	2026-08-08	09:00:00	15:00:00	Calcio	Prenotazione di test #149	confermata	2026-03-12 11:03:03.66755	2026-03-12 11:03:03.66755	\N	3330000000	RSSMRA80A01H501W	CI	DOC149
552	1	2	\N	2026-08-09	12:00:00	12:00:00	Calcio	Prenotazione di test #150	confermata	2026-03-12 11:03:03.66755	2026-03-12 11:03:03.66755	\N	3330000000	RSSMRA80A01H501W	CI	DOC150
553	1	2	\N	2026-08-10	15:00:00	17:00:00	Calcio	Prenotazione di test #151	confermata	2026-03-12 11:03:03.66755	2026-03-12 11:03:03.66755	\N	3330000000	RSSMRA80A01H501W	CI	DOC151
554	1	2	\N	2026-08-11	16:00:00	14:00:00	Calcio	Prenotazione di test #152	confermata	2026-03-12 11:03:03.66755	2026-03-12 11:03:03.66755	\N	3330000000	RSSMRA80A01H501W	CI	DOC152
555	1	2	\N	2026-08-12	11:00:00	15:00:00	Calcio	Prenotazione di test #153	confermata	2026-03-12 11:03:03.66755	2026-03-12 11:03:03.66755	\N	3330000000	RSSMRA80A01H501W	CI	DOC153
556	1	2	\N	2026-08-13	10:00:00	14:00:00	Calcio	Prenotazione di test #154	confermata	2026-03-12 11:03:03.66755	2026-03-12 11:03:03.66755	\N	3330000000	RSSMRA80A01H501W	CI	DOC154
557	1	2	\N	2026-08-14	17:00:00	13:00:00	Calcio	Prenotazione di test #155	confermata	2026-03-12 11:03:03.66755	2026-03-12 11:03:03.66755	\N	3330000000	RSSMRA80A01H501W	CI	DOC155
558	1	2	\N	2026-08-15	17:00:00	17:00:00	Calcio	Prenotazione di test #156	confermata	2026-03-12 11:03:03.66755	2026-03-12 11:03:03.66755	\N	3330000000	RSSMRA80A01H501W	CI	DOC156
559	1	2	\N	2026-08-16	09:00:00	16:00:00	Calcio	Prenotazione di test #157	confermata	2026-03-12 11:03:03.66755	2026-03-12 11:03:03.66755	\N	3330000000	RSSMRA80A01H501W	CI	DOC157
560	1	2	\N	2026-08-17	11:00:00	14:00:00	Calcio	Prenotazione di test #158	confermata	2026-03-12 11:03:03.66755	2026-03-12 11:03:03.66755	\N	3330000000	RSSMRA80A01H501W	CI	DOC158
561	1	2	\N	2026-08-18	17:00:00	19:00:00	Calcio	Prenotazione di test #159	confermata	2026-03-12 11:03:03.66755	2026-03-12 11:03:03.66755	\N	3330000000	RSSMRA80A01H501W	CI	DOC159
562	1	2	\N	2026-08-19	16:00:00	13:00:00	Calcio	Prenotazione di test #160	confermata	2026-03-12 11:03:03.66755	2026-03-12 11:03:03.66755	\N	3330000000	RSSMRA80A01H501W	CI	DOC160
563	1	2	\N	2026-08-20	08:00:00	18:00:00	Calcio	Prenotazione di test #161	confermata	2026-03-12 11:03:03.66755	2026-03-12 11:03:03.66755	\N	3330000000	RSSMRA80A01H501W	CI	DOC161
564	1	2	\N	2026-08-21	10:00:00	18:00:00	Calcio	Prenotazione di test #162	confermata	2026-03-12 11:03:03.66755	2026-03-12 11:03:03.66755	\N	3330000000	RSSMRA80A01H501W	CI	DOC162
565	1	2	\N	2026-08-22	15:00:00	13:00:00	Calcio	Prenotazione di test #163	confermata	2026-03-12 11:03:03.66755	2026-03-12 11:03:03.66755	\N	3330000000	RSSMRA80A01H501W	CI	DOC163
566	1	2	\N	2026-08-23	12:00:00	11:00:00	Calcio	Prenotazione di test #164	confermata	2026-03-12 11:03:03.66755	2026-03-12 11:03:03.66755	\N	3330000000	RSSMRA80A01H501W	CI	DOC164
567	1	2	\N	2026-08-24	10:00:00	13:00:00	Calcio	Prenotazione di test #165	confermata	2026-03-12 11:03:03.66755	2026-03-12 11:03:03.66755	\N	3330000000	RSSMRA80A01H501W	CI	DOC165
568	1	2	\N	2026-08-25	09:00:00	12:00:00	Calcio	Prenotazione di test #166	confermata	2026-03-12 11:03:03.66755	2026-03-12 11:03:03.66755	\N	3330000000	RSSMRA80A01H501W	CI	DOC166
569	1	2	\N	2026-08-26	13:00:00	19:00:00	Calcio	Prenotazione di test #167	confermata	2026-03-12 11:03:03.66755	2026-03-12 11:03:03.66755	\N	3330000000	RSSMRA80A01H501W	CI	DOC167
570	1	2	\N	2026-08-27	15:00:00	11:00:00	Calcio	Prenotazione di test #168	confermata	2026-03-12 11:03:03.66755	2026-03-12 11:03:03.66755	\N	3330000000	RSSMRA80A01H501W	CI	DOC168
571	1	2	\N	2026-08-28	11:00:00	15:00:00	Calcio	Prenotazione di test #169	confermata	2026-03-12 11:03:03.66755	2026-03-12 11:03:03.66755	\N	3330000000	RSSMRA80A01H501W	CI	DOC169
572	1	2	\N	2026-08-29	14:00:00	13:00:00	Calcio	Prenotazione di test #170	confermata	2026-03-12 11:03:03.66755	2026-03-12 11:03:03.66755	\N	3330000000	RSSMRA80A01H501W	CI	DOC170
573	1	2	\N	2026-08-30	16:00:00	12:00:00	Calcio	Prenotazione di test #171	confermata	2026-03-12 11:03:03.66755	2026-03-12 11:03:03.66755	\N	3330000000	RSSMRA80A01H501W	CI	DOC171
574	1	2	\N	2026-08-31	12:00:00	14:00:00	Calcio	Prenotazione di test #172	confermata	2026-03-12 11:03:03.66755	2026-03-12 11:03:03.66755	\N	3330000000	RSSMRA80A01H501W	CI	DOC172
575	1	2	\N	2026-09-01	14:00:00	14:00:00	Calcio	Prenotazione di test #173	confermata	2026-03-12 11:03:03.66755	2026-03-12 11:03:03.66755	\N	3330000000	RSSMRA80A01H501W	CI	DOC173
576	1	2	\N	2026-09-02	09:00:00	13:00:00	Calcio	Prenotazione di test #174	confermata	2026-03-12 11:03:03.66755	2026-03-12 11:03:03.66755	\N	3330000000	RSSMRA80A01H501W	CI	DOC174
577	1	2	\N	2026-09-03	14:00:00	13:00:00	Calcio	Prenotazione di test #175	confermata	2026-03-12 11:03:03.66755	2026-03-12 11:03:03.66755	\N	3330000000	RSSMRA80A01H501W	CI	DOC175
578	1	2	\N	2026-09-04	10:00:00	10:00:00	Calcio	Prenotazione di test #176	confermata	2026-03-12 11:03:03.66755	2026-03-12 11:03:03.66755	\N	3330000000	RSSMRA80A01H501W	CI	DOC176
579	1	2	\N	2026-09-05	15:00:00	18:00:00	Calcio	Prenotazione di test #177	confermata	2026-03-12 11:03:03.66755	2026-03-12 11:03:03.66755	\N	3330000000	RSSMRA80A01H501W	CI	DOC177
580	1	2	\N	2026-09-06	09:00:00	19:00:00	Calcio	Prenotazione di test #178	confermata	2026-03-12 11:03:03.66755	2026-03-12 11:03:03.66755	\N	3330000000	RSSMRA80A01H501W	CI	DOC178
581	1	2	\N	2026-09-07	11:00:00	14:00:00	Calcio	Prenotazione di test #179	confermata	2026-03-12 11:03:03.66755	2026-03-12 11:03:03.66755	\N	3330000000	RSSMRA80A01H501W	CI	DOC179
582	1	2	\N	2026-09-08	08:00:00	16:00:00	Calcio	Prenotazione di test #180	confermata	2026-03-12 11:03:03.66755	2026-03-12 11:03:03.66755	\N	3330000000	RSSMRA80A01H501W	CI	DOC180
583	1	2	\N	2026-09-09	09:00:00	16:00:00	Calcio	Prenotazione di test #181	confermata	2026-03-12 11:03:03.66755	2026-03-12 11:03:03.66755	\N	3330000000	RSSMRA80A01H501W	CI	DOC181
584	1	2	\N	2026-09-10	08:00:00	11:00:00	Calcio	Prenotazione di test #182	confermata	2026-03-12 11:03:03.66755	2026-03-12 11:03:03.66755	\N	3330000000	RSSMRA80A01H501W	CI	DOC182
585	1	2	\N	2026-09-11	10:00:00	10:00:00	Calcio	Prenotazione di test #183	confermata	2026-03-12 11:03:03.66755	2026-03-12 11:03:03.66755	\N	3330000000	RSSMRA80A01H501W	CI	DOC183
586	1	2	\N	2026-09-12	14:00:00	19:00:00	Calcio	Prenotazione di test #184	confermata	2026-03-12 11:03:03.66755	2026-03-12 11:03:03.66755	\N	3330000000	RSSMRA80A01H501W	CI	DOC184
587	1	2	\N	2026-09-13	16:00:00	16:00:00	Calcio	Prenotazione di test #185	confermata	2026-03-12 11:03:03.66755	2026-03-12 11:03:03.66755	\N	3330000000	RSSMRA80A01H501W	CI	DOC185
588	1	2	\N	2026-09-14	15:00:00	14:00:00	Calcio	Prenotazione di test #186	confermata	2026-03-12 11:03:03.66755	2026-03-12 11:03:03.66755	\N	3330000000	RSSMRA80A01H501W	CI	DOC186
589	1	2	\N	2026-09-15	13:00:00	12:00:00	Calcio	Prenotazione di test #187	confermata	2026-03-12 11:03:03.66755	2026-03-12 11:03:03.66755	\N	3330000000	RSSMRA80A01H501W	CI	DOC187
590	1	2	\N	2026-09-16	14:00:00	14:00:00	Calcio	Prenotazione di test #188	confermata	2026-03-12 11:03:03.66755	2026-03-12 11:03:03.66755	\N	3330000000	RSSMRA80A01H501W	CI	DOC188
591	1	2	\N	2026-09-17	11:00:00	10:00:00	Calcio	Prenotazione di test #189	confermata	2026-03-12 11:03:03.66755	2026-03-12 11:03:03.66755	\N	3330000000	RSSMRA80A01H501W	CI	DOC189
592	1	2	\N	2026-09-18	11:00:00	16:00:00	Calcio	Prenotazione di test #190	confermata	2026-03-12 11:03:03.66755	2026-03-12 11:03:03.66755	\N	3330000000	RSSMRA80A01H501W	CI	DOC190
593	1	2	\N	2026-09-19	12:00:00	10:00:00	Calcio	Prenotazione di test #191	confermata	2026-03-12 11:03:03.66755	2026-03-12 11:03:03.66755	\N	3330000000	RSSMRA80A01H501W	CI	DOC191
594	1	2	\N	2026-09-20	15:00:00	14:00:00	Calcio	Prenotazione di test #192	confermata	2026-03-12 11:03:03.66755	2026-03-12 11:03:03.66755	\N	3330000000	RSSMRA80A01H501W	CI	DOC192
595	1	2	\N	2026-09-21	11:00:00	15:00:00	Calcio	Prenotazione di test #193	confermata	2026-03-12 11:03:03.66755	2026-03-12 11:03:03.66755	\N	3330000000	RSSMRA80A01H501W	CI	DOC193
596	1	2	\N	2026-09-22	16:00:00	15:00:00	Calcio	Prenotazione di test #194	confermata	2026-03-12 11:03:03.66755	2026-03-12 11:03:03.66755	\N	3330000000	RSSMRA80A01H501W	CI	DOC194
597	1	2	\N	2026-09-23	16:00:00	13:00:00	Calcio	Prenotazione di test #195	confermata	2026-03-12 11:03:03.66755	2026-03-12 11:03:03.66755	\N	3330000000	RSSMRA80A01H501W	CI	DOC195
598	1	2	\N	2026-09-24	17:00:00	18:00:00	Calcio	Prenotazione di test #196	confermata	2026-03-12 11:03:03.66755	2026-03-12 11:03:03.66755	\N	3330000000	RSSMRA80A01H501W	CI	DOC196
599	1	2	\N	2026-09-25	12:00:00	17:00:00	Calcio	Prenotazione di test #197	confermata	2026-03-12 11:03:03.66755	2026-03-12 11:03:03.66755	\N	3330000000	RSSMRA80A01H501W	CI	DOC197
600	1	2	\N	2026-09-26	12:00:00	10:00:00	Calcio	Prenotazione di test #198	confermata	2026-03-12 11:03:03.66755	2026-03-12 11:03:03.66755	\N	3330000000	RSSMRA80A01H501W	CI	DOC198
601	1	2	\N	2026-09-27	09:00:00	16:00:00	Calcio	Prenotazione di test #199	confermata	2026-03-12 11:03:03.66755	2026-03-12 11:03:03.66755	\N	3330000000	RSSMRA80A01H501W	CI	DOC199
602	1	2	\N	2026-09-28	15:00:00	16:00:00	Calcio	Prenotazione di test #200	confermata	2026-03-12 11:03:03.66755	2026-03-12 11:03:03.66755	\N	3330000000	RSSMRA80A01H501W	CI	DOC200
403	1	2	\N	2026-03-13	09:00:00	12:00:00	Calcio	Prenotazione di test #1	scaduta	2026-03-12 11:03:03.66755	2026-04-05 10:13:56.796051	\N	3330000000	RSSMRA80A01H501W	CI	DOC1
404	1	2	\N	2026-03-14	16:00:00	17:00:00	Calcio	Prenotazione di test #2	scaduta	2026-03-12 11:03:03.66755	2026-04-05 10:13:56.796051	\N	3330000000	RSSMRA80A01H501W	CI	DOC2
405	1	2	\N	2026-03-15	14:00:00	17:00:00	Calcio	Prenotazione di test #3	scaduta	2026-03-12 11:03:03.66755	2026-04-05 10:13:56.796051	\N	3330000000	RSSMRA80A01H501W	CI	DOC3
406	1	2	\N	2026-03-16	13:00:00	19:00:00	Calcio	Prenotazione di test #4	scaduta	2026-03-12 11:03:03.66755	2026-04-05 10:13:56.796051	\N	3330000000	RSSMRA80A01H501W	CI	DOC4
407	1	2	\N	2026-03-17	11:00:00	11:00:00	Calcio	Prenotazione di test #5	scaduta	2026-03-12 11:03:03.66755	2026-04-05 10:13:56.796051	\N	3330000000	RSSMRA80A01H501W	CI	DOC5
408	1	2	\N	2026-03-18	17:00:00	14:00:00	Calcio	Prenotazione di test #6	scaduta	2026-03-12 11:03:03.66755	2026-04-05 10:13:56.796051	\N	3330000000	RSSMRA80A01H501W	CI	DOC6
409	1	2	\N	2026-03-19	15:00:00	13:00:00	Calcio	Prenotazione di test #7	scaduta	2026-03-12 11:03:03.66755	2026-04-05 10:13:56.796051	\N	3330000000	RSSMRA80A01H501W	CI	DOC7
410	1	2	\N	2026-03-20	17:00:00	19:00:00	Calcio	Prenotazione di test #8	scaduta	2026-03-12 11:03:03.66755	2026-04-05 10:13:56.796051	\N	3330000000	RSSMRA80A01H501W	CI	DOC8
411	1	2	\N	2026-03-21	12:00:00	19:00:00	Calcio	Prenotazione di test #9	scaduta	2026-03-12 11:03:03.66755	2026-04-05 10:13:56.796051	\N	3330000000	RSSMRA80A01H501W	CI	DOC9
412	1	2	\N	2026-03-22	16:00:00	11:00:00	Calcio	Prenotazione di test #10	scaduta	2026-03-12 11:03:03.66755	2026-04-05 10:13:56.796051	\N	3330000000	RSSMRA80A01H501W	CI	DOC10
413	1	2	\N	2026-03-23	16:00:00	19:00:00	Calcio	Prenotazione di test #11	scaduta	2026-03-12 11:03:03.66755	2026-04-05 10:13:56.796051	\N	3330000000	RSSMRA80A01H501W	CI	DOC11
414	1	2	\N	2026-03-24	17:00:00	15:00:00	Calcio	Prenotazione di test #12	scaduta	2026-03-12 11:03:03.66755	2026-04-05 10:13:56.796051	\N	3330000000	RSSMRA80A01H501W	CI	DOC12
415	1	2	\N	2026-03-25	11:00:00	18:00:00	Calcio	Prenotazione di test #13	scaduta	2026-03-12 11:03:03.66755	2026-04-05 10:13:56.796051	\N	3330000000	RSSMRA80A01H501W	CI	DOC13
416	1	2	\N	2026-03-26	09:00:00	17:00:00	Calcio	Prenotazione di test #14	scaduta	2026-03-12 11:03:03.66755	2026-04-05 10:13:56.796051	\N	3330000000	RSSMRA80A01H501W	CI	DOC14
417	1	2	\N	2026-03-27	16:00:00	15:00:00	Calcio	Prenotazione di test #15	scaduta	2026-03-12 11:03:03.66755	2026-04-05 10:13:56.796051	\N	3330000000	RSSMRA80A01H501W	CI	DOC15
418	1	2	\N	2026-03-28	08:00:00	18:00:00	Calcio	Prenotazione di test #16	scaduta	2026-03-12 11:03:03.66755	2026-04-05 10:13:56.796051	\N	3330000000	RSSMRA80A01H501W	CI	DOC16
419	1	2	\N	2026-03-29	15:00:00	15:00:00	Calcio	Prenotazione di test #17	scaduta	2026-03-12 11:03:03.66755	2026-04-05 10:13:56.796051	\N	3330000000	RSSMRA80A01H501W	CI	DOC17
420	1	2	\N	2026-03-30	09:00:00	16:00:00	Calcio	Prenotazione di test #18	scaduta	2026-03-12 11:03:03.66755	2026-04-05 10:13:56.796051	\N	3330000000	RSSMRA80A01H501W	CI	DOC18
421	1	2	\N	2026-03-31	16:00:00	13:00:00	Calcio	Prenotazione di test #19	scaduta	2026-03-12 11:03:03.66755	2026-04-05 10:13:56.796051	\N	3330000000	RSSMRA80A01H501W	CI	DOC19
422	1	2	\N	2026-04-01	12:00:00	18:00:00	Calcio	Prenotazione di test #20	scaduta	2026-03-12 11:03:03.66755	2026-04-05 10:13:56.796051	\N	3330000000	RSSMRA80A01H501W	CI	DOC20
423	1	2	\N	2026-04-02	08:00:00	17:00:00	Calcio	Prenotazione di test #21	scaduta	2026-03-12 11:03:03.66755	2026-04-05 10:13:56.796051	\N	3330000000	RSSMRA80A01H501W	CI	DOC21
424	1	2	\N	2026-04-03	08:00:00	12:00:00	Calcio	Prenotazione di test #22	scaduta	2026-03-12 11:03:03.66755	2026-04-05 10:13:56.796051	\N	3330000000	RSSMRA80A01H501W	CI	DOC22
425	1	2	\N	2026-04-04	09:00:00	17:00:00	Calcio	Prenotazione di test #23	scaduta	2026-03-12 11:03:03.66755	2026-04-05 10:13:56.796051	\N	3330000000	RSSMRA80A01H501W	CI	DOC23
\.


--
-- Data for Name: push_subscriptions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.push_subscriptions (id, user_id, endpoint, p256dh, auth, is_admin, user_agent, created_at, updated_at, last_success_at, last_error_at, error_count) FROM stdin;
1	1	https://fcm.googleapis.com/fcm/send/d7iXdLlZ6IE:APA91bGToZnaQ9AGMuROHZmtmOGE0y4WAg9IMLete8V2W2ipktFETAcWMjvPiNCZOLRJJBKx_M99yMoH3RIljYZ4_7Qncr0_xBcDINU0l41iZJiaLy2EK2IY88D8CyCRRR8KDpqUfe1L	BCrZNWEUVeRs0ScxRyHczkZo3nuFgQ6iGoPG7IsHzzX2jD0u0zh5mnl-PYQsLHkyMBGbhY0VVLic9keQGGViG7Y	CYnRL25j9mOX6RY7dR34mQ	t	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	2026-02-26 22:05:26.287358	2026-03-01 23:50:14.672251	2026-03-01 23:50:14.672251	\N	0
\.


--
-- Data for Name: recensioni; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.recensioni (id, utente_id, entita_tipo, entita_id, valutazione, titolo, contenuto, data_recensione, visibile, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: squadre; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.squadre (id, nome, categoria, anno_fondazione, colori_sociali, stemma_url, allenatore_id, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: tipi_utente; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.tipi_utente (id, nome, descrizione) FROM stdin;
0	Utente	Tipo utente standard, con accesso limitato alle funzionalità di base del sistema.
1	Amministratore	Amministratore del sistema con accesso completo
2	Presidente	Presidente della società sportiva.
3	Vice Presidente	Vice Presidente della società sportiva.
4	Dirigente	Dirigente della società sportiva.
5	Segretario	Segretario della società sportiva.
\.


--
-- Data for Name: utenti; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.utenti (id, email, password_hash, nome, cognome, telefono, tipo_utente_id, data_registrazione, stato, created_at, updated_at, oauth_provider, oauth_id, foto_oauth) FROM stdin;
2	info.asdborgovercelli2022@gmail.com	$2b$10$MmIoRrmybBAl3/0qrx2Xf./c/klwWW3pJvO5oY7GeN2BO7VSY9wcW	Luca	Lupi		0	2025-06-06 16:36:49	attivo	2025-06-06 16:36:49	2026-03-01 22:51:53	\N	\N	\N
1	lucalupi03@gmail.com	$2b$10$vLsLCuUqbo0uhCaKhrutR.mJD2AR9Q5pSE.ifhyA/bYXKGIheSUBy	Luca	Lupi	+393498155608	1	2026-02-27 10:12:46	\N	2026-02-27 10:12:46	2026-03-02 01:27:58.443815	google	109424233086465210226	https://lh3.googleusercontent.com/a/ACg8ocKhj1yWMwg9STAzUvzhsY-doKAyia-_f-FFKJza0Z5oP0iGrHWc=s96-c
\.


--
-- Data for Name: utenti_dati_personali; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.utenti_dati_personali (id, utente_id, data_nascita, codice_fiscale) FROM stdin;
1	1	2003-06-03	LPULCU03H03L750D
\.


--
-- Data for Name: utenti_preferenze; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.utenti_preferenze (id, utente_id, ruolo_preferito, piede_preferito) FROM stdin;
1	1	difensore	destro
\.


--
-- Data for Name: utenti_reset_token; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.utenti_reset_token (id, utente_id, token, expires, created_at) FROM stdin;
\.


--
-- Data for Name: utenti_sospensioni; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.utenti_sospensioni (id, utente_id, motivo, data_inizio, data_fine, admin_id, created_at) FROM stdin;
\.


--
-- Name: campi_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.campi_id_seq', 1, true);


--
-- Name: campionati_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.campionati_id_seq', 1, false);


--
-- Name: classifica_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.classifica_id_seq', 1, false);


--
-- Name: dirigenti_squadre_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.dirigenti_squadre_id_seq', 1, false);


--
-- Name: eventi_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.eventi_id_seq', 1, false);


--
-- Name: giocatori_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.giocatori_id_seq', 1, false);


--
-- Name: immagini_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.immagini_id_seq', 5, true);


--
-- Name: notifications_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.notifications_id_seq', 1, false);


--
-- Name: notizie_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.notizie_id_seq', 1, false);


--
-- Name: orari_campi_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.orari_campi_id_seq', 4, true);


--
-- Name: partecipazioni_eventi_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.partecipazioni_eventi_id_seq', 1, false);


--
-- Name: prenotazioni_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.prenotazioni_id_seq', 602, true);


--
-- Name: push_subscriptions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.push_subscriptions_id_seq', 3, true);


--
-- Name: recensioni_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.recensioni_id_seq', 1, false);


--
-- Name: squadre_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.squadre_id_seq', 1, false);


--
-- Name: tipi_utente_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.tipi_utente_id_seq', 1, false);


--
-- Name: utenti_dati_personali_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.utenti_dati_personali_id_seq', 8, true);


--
-- Name: utenti_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.utenti_id_seq', 1, true);


--
-- Name: utenti_preferenze_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.utenti_preferenze_id_seq', 8, true);


--
-- Name: utenti_reset_token_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.utenti_reset_token_id_seq', 1, false);


--
-- Name: utenti_sospensioni_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.utenti_sospensioni_id_seq', 2, true);


--
-- Name: campi campi_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.campi
    ADD CONSTRAINT campi_pkey PRIMARY KEY (id);


--
-- Name: campionati campionati_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.campionati
    ADD CONSTRAINT campionati_pkey PRIMARY KEY (id);


--
-- Name: classifica classifica_campionato_id_squadra_nome_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.classifica
    ADD CONSTRAINT classifica_campionato_id_squadra_nome_key UNIQUE (campionato_id, squadra_nome);


--
-- Name: classifica classifica_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.classifica
    ADD CONSTRAINT classifica_pkey PRIMARY KEY (id);


--
-- Name: dirigenti_squadre dirigenti_squadre_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dirigenti_squadre
    ADD CONSTRAINT dirigenti_squadre_pkey PRIMARY KEY (id);


--
-- Name: dirigenti_squadre dirigenti_squadre_utente_id_squadra_id_ruolo_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dirigenti_squadre
    ADD CONSTRAINT dirigenti_squadre_utente_id_squadra_id_ruolo_key UNIQUE (utente_id, squadra_id, ruolo);


--
-- Name: eventi eventi_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.eventi
    ADD CONSTRAINT eventi_pkey PRIMARY KEY (id);


--
-- Name: giocatori giocatori_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.giocatori
    ADD CONSTRAINT giocatori_pkey PRIMARY KEY (id);


--
-- Name: immagini immagini_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.immagini
    ADD CONSTRAINT immagini_pkey PRIMARY KEY (id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: notizie notizie_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notizie
    ADD CONSTRAINT notizie_pkey PRIMARY KEY (id);


--
-- Name: orari_campi orari_campi_campo_id_giorno_settimana_ora_inizio_ora_fine_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orari_campi
    ADD CONSTRAINT orari_campi_campo_id_giorno_settimana_ora_inizio_ora_fine_key UNIQUE (campo_id, giorno_settimana, ora_inizio, ora_fine);


--
-- Name: orari_campi orari_campi_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orari_campi
    ADD CONSTRAINT orari_campi_pkey PRIMARY KEY (id);


--
-- Name: partecipazioni_eventi partecipazioni_eventi_evento_id_utente_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.partecipazioni_eventi
    ADD CONSTRAINT partecipazioni_eventi_evento_id_utente_id_key UNIQUE (evento_id, utente_id);


--
-- Name: partecipazioni_eventi partecipazioni_eventi_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.partecipazioni_eventi
    ADD CONSTRAINT partecipazioni_eventi_pkey PRIMARY KEY (id);


--
-- Name: prenotazioni prenotazioni_campo_id_data_prenotazione_ora_inizio_ora_fine_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.prenotazioni
    ADD CONSTRAINT prenotazioni_campo_id_data_prenotazione_ora_inizio_ora_fine_key UNIQUE (campo_id, data_prenotazione, ora_inizio, ora_fine);


--
-- Name: prenotazioni prenotazioni_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.prenotazioni
    ADD CONSTRAINT prenotazioni_pkey PRIMARY KEY (id);


--
-- Name: push_subscriptions push_subscriptions_endpoint_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.push_subscriptions
    ADD CONSTRAINT push_subscriptions_endpoint_key UNIQUE (endpoint);


--
-- Name: push_subscriptions push_subscriptions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.push_subscriptions
    ADD CONSTRAINT push_subscriptions_pkey PRIMARY KEY (id);


--
-- Name: recensioni recensioni_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recensioni
    ADD CONSTRAINT recensioni_pkey PRIMARY KEY (id);


--
-- Name: recensioni recensioni_utente_id_entita_tipo_entita_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recensioni
    ADD CONSTRAINT recensioni_utente_id_entita_tipo_entita_id_key UNIQUE (utente_id, entita_tipo, entita_id);


--
-- Name: squadre squadre_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.squadre
    ADD CONSTRAINT squadre_pkey PRIMARY KEY (id);


--
-- Name: tipi_utente tipi_utente_nome_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tipi_utente
    ADD CONSTRAINT tipi_utente_nome_key UNIQUE (nome);


--
-- Name: tipi_utente tipi_utente_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tipi_utente
    ADD CONSTRAINT tipi_utente_pkey PRIMARY KEY (id);


--
-- Name: utenti_dati_personali utenti_dati_personali_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.utenti_dati_personali
    ADD CONSTRAINT utenti_dati_personali_pkey PRIMARY KEY (id);


--
-- Name: utenti_dati_personali utenti_dati_personali_utente_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.utenti_dati_personali
    ADD CONSTRAINT utenti_dati_personali_utente_id_key UNIQUE (utente_id);


--
-- Name: utenti utenti_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.utenti
    ADD CONSTRAINT utenti_email_key UNIQUE (email);


--
-- Name: utenti utenti_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.utenti
    ADD CONSTRAINT utenti_pkey PRIMARY KEY (id);


--
-- Name: utenti_preferenze utenti_preferenze_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.utenti_preferenze
    ADD CONSTRAINT utenti_preferenze_pkey PRIMARY KEY (id);


--
-- Name: utenti_preferenze utenti_preferenze_utente_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.utenti_preferenze
    ADD CONSTRAINT utenti_preferenze_utente_id_key UNIQUE (utente_id);


--
-- Name: utenti_reset_token utenti_reset_token_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.utenti_reset_token
    ADD CONSTRAINT utenti_reset_token_pkey PRIMARY KEY (id);


--
-- Name: utenti_reset_token utenti_reset_token_utente_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.utenti_reset_token
    ADD CONSTRAINT utenti_reset_token_utente_id_key UNIQUE (utente_id);


--
-- Name: utenti_sospensioni utenti_sospensioni_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.utenti_sospensioni
    ADD CONSTRAINT utenti_sospensioni_pkey PRIMARY KEY (id);


--
-- Name: utenti_sospensioni utenti_sospensioni_utente_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.utenti_sospensioni
    ADD CONSTRAINT utenti_sospensioni_utente_id_key UNIQUE (utente_id);


--
-- Name: idx_notifications_created; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notifications_created ON public.notifications USING btree (created_at DESC);


--
-- Name: idx_notifications_status_sendafter; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notifications_status_sendafter ON public.notifications USING btree (status, send_after) WHERE (((status)::text = 'pending'::text) OR ((status)::text = 'failed'::text));


--
-- Name: idx_notifications_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notifications_type ON public.notifications USING btree (type);


--
-- Name: idx_push_subscriptions_endpoint; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_push_subscriptions_endpoint ON public.push_subscriptions USING btree (endpoint);


--
-- Name: idx_push_subscriptions_is_admin; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_push_subscriptions_is_admin ON public.push_subscriptions USING btree (is_admin);


--
-- Name: idx_push_subscriptions_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_push_subscriptions_user_id ON public.push_subscriptions USING btree (user_id);


--
-- Name: idx_reset_expires; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_reset_expires ON public.utenti_reset_token USING btree (expires);


--
-- Name: idx_reset_token; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_reset_token ON public.utenti_reset_token USING btree (token);


--
-- Name: idx_sospensioni_admin; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sospensioni_admin ON public.utenti_sospensioni USING btree (admin_id);


--
-- Name: idx_utenti_oauth; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_utenti_oauth ON public.utenti USING btree (oauth_provider, oauth_id) WHERE ((oauth_provider IS NOT NULL) AND (oauth_id IS NOT NULL));


--
-- Name: push_subscriptions push_subscriptions_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER push_subscriptions_updated_at BEFORE UPDATE ON public.push_subscriptions FOR EACH ROW EXECUTE FUNCTION public.update_push_subscriptions_updated_at();


--
-- Name: classifica classifica_campionato_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.classifica
    ADD CONSTRAINT classifica_campionato_id_fkey FOREIGN KEY (campionato_id) REFERENCES public.campionati(id);


--
-- Name: classifica classifica_nostra_squadra_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.classifica
    ADD CONSTRAINT classifica_nostra_squadra_id_fkey FOREIGN KEY (nostra_squadra_id) REFERENCES public.squadre(id);


--
-- Name: dirigenti_squadre dirigenti_squadre_squadra_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dirigenti_squadre
    ADD CONSTRAINT dirigenti_squadre_squadra_id_fkey FOREIGN KEY (squadra_id) REFERENCES public.squadre(id);


--
-- Name: dirigenti_squadre dirigenti_squadre_utente_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dirigenti_squadre
    ADD CONSTRAINT dirigenti_squadre_utente_id_fkey FOREIGN KEY (utente_id) REFERENCES public.utenti(id);


--
-- Name: eventi eventi_autore_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.eventi
    ADD CONSTRAINT eventi_autore_id_fkey FOREIGN KEY (autore_id) REFERENCES public.utenti(id);


--
-- Name: eventi eventi_campo_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.eventi
    ADD CONSTRAINT eventi_campo_id_fkey FOREIGN KEY (campo_id) REFERENCES public.campi(id);


--
-- Name: eventi eventi_squadra_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.eventi
    ADD CONSTRAINT eventi_squadra_id_fkey FOREIGN KEY (squadra_id) REFERENCES public.squadre(id);


--
-- Name: giocatori fk_giocatori_immagini; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.giocatori
    ADD CONSTRAINT fk_giocatori_immagini FOREIGN KEY (immagini_id) REFERENCES public.immagini(id);


--
-- Name: giocatori giocatori_squadra_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.giocatori
    ADD CONSTRAINT giocatori_squadra_id_fkey FOREIGN KEY (squadra_id) REFERENCES public.squadre(id);


--
-- Name: giocatori giocatori_utente_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.giocatori
    ADD CONSTRAINT giocatori_utente_id_fkey FOREIGN KEY (utente_id) REFERENCES public.utenti(id);


--
-- Name: notizie notizie_autore_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notizie
    ADD CONSTRAINT notizie_autore_id_fkey FOREIGN KEY (autore_id) REFERENCES public.utenti(id);


--
-- Name: notizie notizie_immagine_principale_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notizie
    ADD CONSTRAINT notizie_immagine_principale_id_fkey FOREIGN KEY (immagine_principale_id) REFERENCES public.immagini(id);


--
-- Name: orari_campi orari_campi_campo_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orari_campi
    ADD CONSTRAINT orari_campi_campo_id_fkey FOREIGN KEY (campo_id) REFERENCES public.campi(id);


--
-- Name: partecipazioni_eventi partecipazioni_eventi_evento_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.partecipazioni_eventi
    ADD CONSTRAINT partecipazioni_eventi_evento_id_fkey FOREIGN KEY (evento_id) REFERENCES public.eventi(id);


--
-- Name: partecipazioni_eventi partecipazioni_eventi_utente_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.partecipazioni_eventi
    ADD CONSTRAINT partecipazioni_eventi_utente_id_fkey FOREIGN KEY (utente_id) REFERENCES public.utenti(id);


--
-- Name: prenotazioni prenotazioni_campo_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.prenotazioni
    ADD CONSTRAINT prenotazioni_campo_id_fkey FOREIGN KEY (campo_id) REFERENCES public.campi(id);


--
-- Name: prenotazioni prenotazioni_squadra_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.prenotazioni
    ADD CONSTRAINT prenotazioni_squadra_id_fkey FOREIGN KEY (squadra_id) REFERENCES public.squadre(id);


--
-- Name: prenotazioni prenotazioni_utente_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.prenotazioni
    ADD CONSTRAINT prenotazioni_utente_id_fkey FOREIGN KEY (utente_id) REFERENCES public.utenti(id);


--
-- Name: recensioni recensioni_utente_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recensioni
    ADD CONSTRAINT recensioni_utente_id_fkey FOREIGN KEY (utente_id) REFERENCES public.utenti(id);


--
-- Name: squadre squadre_allenatore_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.squadre
    ADD CONSTRAINT squadre_allenatore_id_fkey FOREIGN KEY (allenatore_id) REFERENCES public.utenti(id);


--
-- Name: utenti_dati_personali utenti_dati_personali_utente_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.utenti_dati_personali
    ADD CONSTRAINT utenti_dati_personali_utente_id_fkey FOREIGN KEY (utente_id) REFERENCES public.utenti(id) ON DELETE CASCADE;


--
-- Name: utenti_preferenze utenti_preferenze_utente_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.utenti_preferenze
    ADD CONSTRAINT utenti_preferenze_utente_id_fkey FOREIGN KEY (utente_id) REFERENCES public.utenti(id) ON DELETE CASCADE;


--
-- Name: utenti_reset_token utenti_reset_token_utente_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.utenti_reset_token
    ADD CONSTRAINT utenti_reset_token_utente_id_fkey FOREIGN KEY (utente_id) REFERENCES public.utenti(id) ON DELETE CASCADE;


--
-- Name: utenti_sospensioni utenti_sospensioni_admin_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.utenti_sospensioni
    ADD CONSTRAINT utenti_sospensioni_admin_id_fkey FOREIGN KEY (admin_id) REFERENCES public.utenti(id);


--
-- Name: utenti_sospensioni utenti_sospensioni_utente_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.utenti_sospensioni
    ADD CONSTRAINT utenti_sospensioni_utente_id_fkey FOREIGN KEY (utente_id) REFERENCES public.utenti(id) ON DELETE CASCADE;


--
-- Name: utenti utenti_tipo_utente_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.utenti
    ADD CONSTRAINT utenti_tipo_utente_id_fkey FOREIGN KEY (tipo_utente_id) REFERENCES public.tipi_utente(id);


--
-- PostgreSQL database dump complete
--

\unrestrict XSRn7zahH2wRO10rshv1geTi8YYCyAqcSSIhwG3Fp33xioSbkQI9dwxl6O26vT3

