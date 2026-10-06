# SmartExam – Genetic Algorithm Engine Documentation

## 1. Mathematical Model

### 1.1 Chromosome Representation
A Chromosome $C$ represents a complete candidate examination schedule:
$$C = \{ g_1, g_2, \dots, g_N \}$$
where each gene $g_i$ corresponds to an exam $E_i$ and is defined as a 4-tuple:
$$g_i = (E_i, S_k, R_m, F_p)$$
- $E_i$: Required subject examination
- $S_k$: Allocated exam slot (Date + Session)
- $R_m$: Allocated room
- $F_p$: Allocated invigilator (Faculty)

### 1.2 Fitness Function
Minimization objective cost function:
$$\text{Cost}(C) = W_{\text{hard}} \cdot \sum_{i=1}^{10} \text{HC}_i(C) + \sum_{j=1}^{5} w_j \cdot \text{SC}_j(C)$$
Where $W_{\text{hard}} = 10,000$ (ensuring hard violations dominate soft penalties).

## 2. Hard Constraints (HC-01 to HC-10)
1. **HC-01 Student Conflict**: No student enrolled in multiple exams in slot $S_k$.
2. **HC-02 Room Conflict**: No room hosting multiple exams in slot $S_k$.
3. **HC-03 Room Capacity**: $\text{Capacity}(R_m) \ge \text{EnrolledStudents}(E_i)$.
4. **HC-04 Faculty Conflict**: No invigilator assigned to multiple rooms in slot $S_k$.
5. **HC-05 Room Availability**: $R_m$ is available in $S_k$.
6. **HC-06 Faculty Availability**: $F_p$ is available in $S_k$.
7. **HC-07 Slot Availability**: $S_k$ is active.
8. **HC-08 Locked Assignment**: Preserved untouched by crossover & mutation.
9. **HC-09 Exam Relationship**: Valid reference to active subject.
10. **HC-10 Assignment Completeness**: Every required exam is scheduled.

## 3. GA Operators
- **Selection**: Tournament selection with configurable tournament size $T=5$.
- **Crossover**: Timetable-safe uniform crossover preserving locked genes.
- **Mutation**: Random perturbation (slot change, room change, faculty change, exam swap) applied with rate $p_m=0.10$.
- **Repair**: Guided heuristic repair mechanism resolving room capacities and slot clashes.
- **Elitism**: Top $E=5$ individuals copied directly into next generation.
