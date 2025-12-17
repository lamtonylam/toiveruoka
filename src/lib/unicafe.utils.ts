export const checkIfDateIsPast = (dateString: string): boolean => {
  const today = new Date();

  const formattedDateString = dateString
    .split(' ')
    .slice(1)
    .join(' ')
    .slice(0, -1);
  const dateParts = formattedDateString.split('.');
  const day = parseInt(dateParts[0]);
  const month = parseInt(dateParts[1]) - 1; // subtract 1 because months are 0-indexed
  const dateToCheck = new Date(today.getFullYear(), month, day);

  const startOfToday = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  );

  return dateToCheck < startOfToday;
};
