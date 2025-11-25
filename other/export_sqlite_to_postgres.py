#!/usr/bin/env python3
"""
Script to export SQLite database data to PostgreSQL INSERT statements
"""
import sqlite3
import os
import sys
from datetime import datetime

def escape_sql_value(value):
    """Escape SQL values for PostgreSQL"""
    if value is None:
        return 'NULL'
    elif isinstance(value, bool):
        return 'true' if value else 'false'
    elif isinstance(value, str):
        # Escape single quotes by doubling them
        return f"'{value.replace(chr(39), chr(39)*2)}'"
    elif isinstance(value, (int, float)):
        return str(value)
    else:
        # For other types, convert to string and escape
        return f"'{str(value).replace(chr(39), chr(39)*2)}'"

def export_table_to_postgres(cursor, table_name):
    """Export a single table to PostgreSQL INSERT statements"""
    try:
        # Get column information
        cursor.execute(f"PRAGMA table_info({table_name})")
        columns_info = cursor.fetchall()

        if not columns_info:
            print(f"-- Table {table_name} has no columns or doesn't exist")
            return []

        # Get column names
        columns = [col[1] for col in columns_info]
        column_names = ', '.join(columns)

        # Build query (no filtering needed for TIPI_UTENTE)
        query = f"SELECT * FROM {table_name}"

        # Get data
        cursor.execute(query)
        rows = cursor.fetchall()

        if not rows:
            print(f"-- Table {table_name} is empty")
            return []

        insert_statements = []
        for row in rows:
            # Convert row values to PostgreSQL format
            values = []
            for i, value in enumerate(row):
                col_name = columns[i]
                col_type = columns_info[i][2].upper()

                # Handle type conversions
                if col_type in ['BOOLEAN', 'BOOL']:
                    if value is None:
                        values.append('NULL')
                    elif value in [0, '0', False, 'false', 'FALSE']:
                        values.append('false')
                    else:
                        values.append('true')
                elif 'INT' in col_type:
                    if value is None:
                        values.append('NULL')
                    else:
                        values.append(str(int(value)))
                elif col_type in ['REAL', 'FLOAT', 'DOUBLE']:
                    if value is None:
                        values.append('NULL')
                    else:
                        values.append(str(float(value)))
                else:
                    # String or other types
                    values.append(escape_sql_value(value))

            values_str = ', '.join(values)
            insert_stmt = f"INSERT INTO {table_name} ({column_names}) VALUES ({values_str});"
            insert_statements.append(insert_stmt)

        return insert_statements

    except Exception as e:
        print(f"Error exporting table {table_name}: {e}")
        return []

def main():
    import argparse

    parser = argparse.ArgumentParser(description='Export SQLite TIPI_UTENTE table to PostgreSQL INSERT statements')
    parser.add_argument('--db-path', default='database/database.db', help='Path to SQLite database file')

    args = parser.parse_args()

    db_path = args.db_path

    if not os.path.exists(db_path):
        print(f"Database file not found: {db_path}")
        sys.exit(1)

    try:
        # Connect to SQLite database
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()

        # Get all table names (excluding system tables)
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'")
        tables = cursor.fetchall()

        if not tables:
            print("No tables found in database")
            return

        filter_desc = ""
        print("-- ========================================")
        print("-- PostgreSQL INSERT statements for TIPI_UTENTE table")
        print(f"-- Generated from SQLite database: {db_path}{filter_desc}")
        print(f"-- Generated on: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print("-- ========================================")
        print()

        # Export only TIPI_UTENTE table
        table_name = "TIPI_UTENTE"
        print(f"-- Exporting table: {table_name}")
        print(f"-- {'='*50}")

        insert_statements = export_table_to_postgres(cursor, table_name)

        if insert_statements:
            for stmt in insert_statements:
                print(stmt)
            print(f"-- {len(insert_statements)} rows inserted into {table_name}")
        else:
            print(f"-- No data to export from {table_name}")

        print()

        conn.close()

    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()