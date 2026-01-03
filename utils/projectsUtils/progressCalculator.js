// Calculate progress from workflow array
const calculateWorkflowProgress = (workflow) => {
  if (!Array.isArray(workflow)) {
    try {
      workflow = JSON.parse(workflow);
    } catch (error) {
      workflow = [];
    }
  }

  let totalWeight = 0;
  let completedWeight = 0;
  let anyInProgress = false;

  workflow.forEach((task) => {
    totalWeight += task.weight || 0;
    if (task.status === "completed") {
      completedWeight += task.weight || 0;
    } else if (task.status === "in_progress") {
      anyInProgress = true;
    }
  });

  const progress = totalWeight > 0 ? (completedWeight / totalWeight) * 100 : 0;

  // Determine status based on progress
  let status = "pending";
  if (progress >= 100) {
    status = "completed";
  } else if (progress > 0 || anyInProgress) {
    status = "in_progress";
  }

  return {
    progress: parseFloat(progress.toFixed(2)),
    status,
  };
};

// Calculate aggregate progress from array of items
const calculateAggregateProgress = (items) => {
  if (!items || items.length === 0) return 0;

  const totalProgress = items.reduce((sum, item) => {
    return sum + (item.progress_percentage || 0);
  }, 0);

  return parseFloat((totalProgress / items.length).toFixed(2));
};

// Determine status from array of items
const calculateAggregateStatus = (items) => {
  if (!items || items.length === 0) return "pending";

  const allCompleted = items.every((item) => item.progress_percentage >= 100);
  if (allCompleted) return "completed";

  const anyInProgress = items.some(
    (item) => item.progress_percentage > 0 && item.progress_percentage < 100
  );

  return anyInProgress ? "in_progress" : "pending";
};

module.exports = {
  calculateWorkflowProgress,
  calculateAggregateProgress,
  calculateAggregateStatus,
};
