using Domain.Entities;
using Domain.Enums;

namespace Application.Interfaces;

public interface IWorkflowService
{
    ApplicationStatus GetNextStatus(ApplicationStatus current, ProgramDurationType durationType, bool approve);
}