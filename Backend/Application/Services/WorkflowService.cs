using Application.Interfaces;
using Domain.Enums;

namespace Application.Services;

public class WorkflowService : IWorkflowService
{
    public ApplicationStatus GetNextStatus(
        ApplicationStatus current,
        ProgramDurationType durationType,
        bool approve)
    {
        if (!approve) return ApplicationStatus.Rejected;

        return (current, durationType) switch
        {
            // Student submits long-term → goes to Academic Advisor
            (ApplicationStatus.Draft, ProgramDurationType.LongTerm)
                => ApplicationStatus.Pending_AcademicAdvisor,

            // Student submits short-term → bypasses Advisor, goes directly to TDHEP
            (ApplicationStatus.Draft, ProgramDurationType.ShortTerm)
                => ApplicationStatus.Pending_TDHEP,

            // Academic Advisor approves → goes to TDHEP
            (ApplicationStatus.Pending_AcademicAdvisor, _)
                => ApplicationStatus.Pending_TDHEP,

            // TDHEP approves → fully approved
            (ApplicationStatus.Pending_TDHEP, _)
                => ApplicationStatus.Approved,

            _ => throw new InvalidOperationException(
                $"No valid transition from {current}")
        };
    }
}