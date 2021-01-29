import * as express from 'express';
import * as bodyParser from 'body-parser';
import axios from 'axios';
import * as moment from 'moment';

const app = express();
const PORT = 8000

app.use(bodyParser.urlencoded({
  extended: true
}));

app.post('/get-available', (req, res) => {
  const dateTime = moment(req.body.dateTime).valueOf();

  isOpen(dateTime)
    .then((open) => {
      if (!open) {
        res.status(200).send({available: false})
      }
      else {
        isReserved(dateTime)
          .then((reserved) => {
            if (!reserved) {
              res.status(200).send({available: true})
            }
            else {
              res.status(200).send({available: false})
            }
          });
      }
    });
});

const isOpen = (dateTime) => {
  return new Promise(((resolve, reject) => {
    return axios.get('http://localhost:8080/timetables?date=2021-01-26&resourceId=1337')
      .then((response) => {
        const timeTable = response.data.timetables;
        const morningOpen = moment(timeTable[0].opening).valueOf();
        const morningClose = moment(timeTable[0].closing).valueOf();
        const eveningOpen = moment(timeTable[1].opening).valueOf()
        const eveningClose = moment(timeTable[1].closing).valueOf()

        const morning = (dateTime >= morningOpen && dateTime <= morningClose);
        const evening = (dateTime >= eveningOpen && dateTime <= eveningClose);
        if (morning || evening) {
          resolve(true);
        }
        else {
          resolve(false);
        }

      })
      .catch((err) => {
        console.error(err);
        reject(err);
      });
  }));
}

const isReserved = (dateTime) => {
  return new Promise(((resolve, reject) => {
    axios.get('http://localhost:8080/reservations?date=2021-01-26&resourceId=1337')
      .then((response) => {
        const reservationSet = response.data.reservations;
        let hasReservation = [];
        reservationSet.forEach((reservation) => {
          const begin = moment(reservation.reservationStart).valueOf();
          const finish = moment(reservation.reservationEnd).valueOf();
          if (dateTime < begin || dateTime > finish) {
            hasReservation.push(true);
          }
          else {
            hasReservation.push(false);
          }
        });

        if (hasReservation.indexOf(false) >= 0) {
          resolve(true);
        }
        else {
          resolve(false);
        }
      })
      .catch((err) => {
        reject(err);
      });
  }));
}

app.listen(PORT, () => {
  console.log(`Server listen : ${PORT}`);
})
