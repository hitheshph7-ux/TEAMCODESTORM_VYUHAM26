"""
Test: Dependency management, DAG validation, circular detection
"""
import pytest
from app.orchestration.dependencies import detect_circular_dependency, get_execution_order


def test_no_circular_dependency():
    """Linear chain: A -> B -> C"""
    task_ids = ["A", "B", "C"]
    deps = {"B": ["A"], "C": ["B"]}
    assert detect_circular_dependency(task_ids, deps) == False


def test_detect_circular_dependency():
    """Circular: A -> B -> C -> A"""
    task_ids = ["A", "B", "C"]
    deps = {"B": ["A"], "C": ["B"], "A": ["C"]}
    assert detect_circular_dependency(task_ids, deps) == True


def test_parallel_tasks_no_cycle():
    """Parallel tasks: A -> C, B -> C"""
    task_ids = ["A", "B", "C"]
    deps = {"C": ["A", "B"]}
    assert detect_circular_dependency(task_ids, deps) == False


def test_topological_sort_linear():
    """A -> B -> C should sort to [A, B, C]"""
    task_ids = ["A", "B", "C"]
    deps = {"B": ["A"], "C": ["B"]}
    order = get_execution_order(task_ids, deps)
    assert order.index("A") < order.index("B")
    assert order.index("B") < order.index("C")


def test_topological_sort_with_parallel():
    """A -> C, B -> C : A and B before C"""
    task_ids = ["A", "B", "C"]
    deps = {"C": ["A", "B"]}
    order = get_execution_order(task_ids, deps)
    assert order.index("A") < order.index("C")
    assert order.index("B") < order.index("C")


def test_circular_raises_on_execution_order():
    """Should raise ValueError for circular dependencies"""
    task_ids = ["A", "B"]
    deps = {"A": ["B"], "B": ["A"]}
    with pytest.raises(ValueError, match="Circular dependency"):
        get_execution_order(task_ids, deps)


def test_no_deps_all_independent():
    """All tasks independent – any order valid"""
    task_ids = ["A", "B", "C"]
    deps = {}
    order = get_execution_order(task_ids, deps)
    assert set(order) == set(task_ids)
