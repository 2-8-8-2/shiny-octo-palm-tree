#!/usr/bin/env python3
"""Simple command-line todo manager."""

import json
import sys
from pathlib import Path

DATA_FILE = Path("todos.json")


def load_todos():
    # TODO: support loading from a remote URL for team-shared lists
    if DATA_FILE.exists():
        with DATA_FILE.open() as f:
            return json.load(f)
    return []


def save_todos(todos):
    with DATA_FILE.open("w") as f:
        json.dump(todos, f, indent=2)


def add_todo(text):
    todos = load_todos()
    todos.append({"id": len(todos) + 1, "text": text, "done": False})
    save_todos(todos)
    print(f"Added: {text}")


def list_todos(show_all=False):
    todos = load_todos()
    # TODO: add --sort flag to order by insertion time or alphabetically
    visible = todos if show_all else [t for t in todos if not t["done"]]
    if not visible:
        print("No todos." if show_all else "No pending todos.")
        return
    for t in visible:
        status = "x" if t["done"] else " "
        print(f"[{status}] {t['id']}. {t['text']}")


def complete_todo(*todo_ids):
    todos = load_todos()
    id_set = set(todo_ids)
    matched = set()
    for t in todos:
        if t["id"] in id_set:
            t["done"] = True
            matched.add(t["id"])
            print(f"Done: {t['text']}")
    if matched:
        save_todos(todos)
    for missing in sorted(id_set - matched):
        print(f"No todo with id {missing}.")


def delete_todo(todo_id):
    todos = load_todos()
    remaining = [t for t in todos if t["id"] != todo_id]
    if len(remaining) == len(todos):
        print(f"No todo with id {todo_id}.")
        return
    save_todos(remaining)
    print(f"Deleted todo {todo_id}.")


USAGE = """\
Usage:
  todo.py add <text>         Add a new todo
  todo.py list [--all]       List todos (pending only, or all)
  todo.py complete <id>...   Mark one or more todos as done
  todo.py delete <id>        Remove a todo
"""


def main(argv):
    if len(argv) < 2:
        print(USAGE)
        sys.exit(1)

    cmd = argv[1]

    if cmd == "add":
        if len(argv) < 3:
            print("Usage: todo.py add <text>")
            sys.exit(1)
        add_todo(" ".join(argv[2:]))

    elif cmd == "list":
        show_all = "--all" in argv
        list_todos(show_all)

    elif cmd == "complete":
        if len(argv) < 3:
            print("Usage: todo.py complete <id> [<id> ...]")
            sys.exit(1)
        complete_todo(*[int(a) for a in argv[2:]])

    elif cmd == "delete":
        if len(argv) < 3:
            print("Usage: todo.py delete <id>")
            sys.exit(1)
        delete_todo(int(argv[2]))

    else:
        print(f"Unknown command: {cmd}\n{USAGE}")
        sys.exit(1)


if __name__ == "__main__":
    main(sys.argv)
