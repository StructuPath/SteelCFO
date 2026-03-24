# SteelCFO - AI Chief Financial Officer for Steel Contractors

# Default: show available commands
default:
    @just --list

# Start interactive CFO session
cfo:
    pi --agent cfo

# Generate weekly executive brief
weekly-brief:
    pi --agent cfo --prompt cfo-brief

# Quick cash position & outlook
cash-check:
    pi --agent treasury-analyst --prompt cash-scenario

# Deep-dive on a specific job
job-review job_id:
    pi --agent job-cost-analyst --prompt job-review --var job_id={{job_id}}

# Top risks with recommended actions
risk-scan:
    pi --agent risk-analyst

# Backlog & pipeline analysis
backlog:
    pi --agent cfo --run "Analyze our current backlog and pipeline using backlog_report. Show contracted work, weighted pipeline, and months of work remaining."

# Bid/no-bid decision support for a new opportunity
bid-decision:
    pi --agent cfo --prompt bid-decision

# Load sample data
load-sample:
    pi --agent cfo --run "Import all sample data: import_data for each file in data/sample/ (jobs.csv as jobs, costs.csv as costs, ar.csv as ar, ap.csv as ap, payroll.csv as payroll, change_orders.csv as change_orders, bank.csv as bank). Confirm what was loaded."
