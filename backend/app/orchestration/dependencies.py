"""
Dependency engine – DAG validation and evaluation.
"""
from typing import List, Dict, Set
from collections import defaultdict, deque


def build_adjacency(tasks: list, dependencies: Dict[str, List[str]]) -> Dict[str, List[str]]:
    """Build adjacency list: task_id -> [task_ids that depend on it]."""
    adj = defaultdict(list)
    for task_id, deps in dependencies.items():
        for dep_id in deps:
            adj[dep_id].append(task_id)
    return dict(adj)


def detect_circular_dependency(
    task_ids: List[str],
    dependencies: Dict[str, List[str]],
) -> bool:
    """
    Use Kahn's algorithm to detect circular dependencies.
    Returns True if a cycle is detected.
    """
    in_degree = {t: 0 for t in task_ids}
    for task_id, deps in dependencies.items():
        for dep in deps:
            in_degree[task_id] = in_degree.get(task_id, 0) + 1

    # Start with nodes with in_degree 0
    queue = deque([t for t in task_ids if in_degree.get(t, 0) == 0])
    visited = 0

    # Build adj
    adj = defaultdict(list)
    for task_id, deps in dependencies.items():
        for dep_id in deps:
            adj[dep_id].append(task_id)

    while queue:
        node = queue.popleft()
        visited += 1
        for neighbor in adj.get(node, []):
            in_degree[neighbor] -= 1
            if in_degree[neighbor] == 0:
                queue.append(neighbor)

    return visited != len(task_ids)  # If not all visited, there's a cycle


def get_execution_order(
    task_ids: List[str],
    dependencies: Dict[str, List[str]],
) -> List[str]:
    """
    Return topological sort of task IDs.
    Raises ValueError on circular dependency.
    """
    if detect_circular_dependency(task_ids, dependencies):
        raise ValueError("Circular dependency detected in task graph")

    in_degree = {t: 0 for t in task_ids}
    adj = defaultdict(list)

    for task_id, deps in dependencies.items():
        for dep_id in deps:
            adj[dep_id].append(task_id)
            in_degree[task_id] = in_degree.get(task_id, 0) + 1

    queue = deque([t for t in task_ids if in_degree.get(t, 0) == 0])
    result = []

    while queue:
        node = queue.popleft()
        result.append(node)
        for neighbor in sorted(adj.get(node, [])):
            in_degree[neighbor] -= 1
            if in_degree[neighbor] == 0:
                queue.append(neighbor)

    return result
