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

  // handle year transition
  const currentMonth = today.getMonth();
  let year = today.getFullYear();
  // if the current month is January and the month to check is December, it's last year
  if (currentMonth === 0 && month === 11) {
    year = today.getFullYear() - 1;
  } else if (currentMonth === 11 && month === 0) {
    year = today.getFullYear() + 1;
  }

  const dateToCheck = new Date(year, month, day);

  const startOfToday = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  );

  return dateToCheck < startOfToday;
};
