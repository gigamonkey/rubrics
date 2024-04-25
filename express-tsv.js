const tsv = (req, res, next) => {
  res.tsv = function (data, filename) {
    if (filename) {
      this.setHeader('content-type', 'text/tab-separated-values');
      this.setHeader('content-disposition', 'attachment; filename="' + filename + '.tsv"');
    } else {
      this.setHeader('content-type', 'text/plain');
    }
    this.send(data.map(row => row.join('\t')).join('\n'));
  };
  next();
};

export { tsv };
